const os = require('os')
const oui = require('oui')
const { exec } = require('child_process')

const Device = require('../Device')
const Platform = require('../Platform')
const DeviceModel = require('../../models/Device')
const PresenceDevice = require('./PresenceDevice')
const PresenceHuman = require('./Devices/Human')
const arrayUtils = require('../../lib/arrayUtils')

const http500 = 500

class PresencePlatform extends Platform {
  setting = {
    netinterface: '',
    toDisplayList: function () {
      const result = {}

      const interfacelist = {}
      for (const ni of this.netinterfaces) { interfacelist[ni] = ni }

      result.netinterface = {
        type: 'select',
        title: 'Network interface',
        value: this.setting.netinterface,
        lookup: JSON.stringify(interfacelist).replace(/["]/g, "'"),
        error: !this.setting.netinterface,
        canclear: false
      }

      return result
    }.bind(this)
  };

  netinterfaces = [];
  macaddresses = {};

  GetStatusInfos() {
    let result = []
    if (!this.setting.netinterface) result.push({ error: true, message: 'Network interface not set' })
    const statusinfos = super.GetStatusInfos()
    if (Array.isArray(statusinfos)) { result = result.concat(statusinfos) }
    return result
  }

  Tick(seconds) {
    if (seconds % 60 !== 0) { return }

    const nets = os.networkInterfaces()
    this.netinterfaces = Object.keys(nets)

    for (const name of this.netinterfaces) {
      if (name === this.setting.netinterface) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal && net.cidr) {
            this
              .UpdateNetworkPresences(net.cidr)
              .then(macs => {
                for (const device of this.devices) {
                  if (!(device instanceof PresenceHuman)) { device.Tick(seconds) }
                }
                for (const device of this.devices) {
                  if (device instanceof PresenceHuman) { device.Tick(seconds) }
                }
              })
              .catch(err => logger.error(err.message))
          }
        }
      }
    }
  }

  UpdateNetworkPresences(cidr) {
    const cmd = os.platform() === 'win32' ? 'arp -a' : `nmap -sP ${cidr}`

    return new Promise(function (resolve, reject) {
      if (!cmd) resolve([])

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          logger.error(error.message)
          reject(error)
        } else if (stderr) {
          logger.error(stderr)
          reject(new Error(stderr))
        } else {
          const lines = stdout.split(os.EOL)

          let _macaddresses = []
          for (const line of lines) {
            const match = line.toLowerCase().match(/(([0-9a-f]{2}[:-]){5}([0-9a-f]{2}))/)
            if (match) { _macaddresses.push(match[1].replace(/-/g, ':')) }
          }
          _macaddresses = _macaddresses.filter((x, i) => i === _macaddresses.indexOf(x)) // Remove duplicates
          _macaddresses.sort()

          logger.debug(`[Presence] MAC addresses on (${cidr}): ${_macaddresses.length} addresses`)

          this.macaddresses = {}
          for (const _macaddress of _macaddresses) {
            let vendor = oui(_macaddress)
            if (vendor === 'null') vendor = ''
            if (vendor) vendor = vendor.split(' ')[0]

            this.macaddresses[_macaddress] = vendor
          }

          resolve(this.macaddresses)
        }
      })
    }.bind(this))
  }

  async Start() {
    this.approuter.get('/', this.WebMainPage.bind(this))
    this.approuter.post('/adddevice', this.WebAddDevice.bind(this))
    this.approuter.post('/deletedevice', this.WebDeleteDevice.bind(this))

    for (const device of await DeviceModel.GetPlatformDevicesSync(this.GetCode())) { await this.CreateAndStartDevice(device.Type, device.Id, device.Name) }
    await super.Start()
    logger.info(`[Platform] ${this.constructor.name} started with ${this.devices.length} device(s)`)
  }

  async CreateAndStartDevice(type, id, name) {
    try {
      const deviceobj = PresenceDevice.CreateByType(type, id, this, name)
      await deviceobj.Start()
      this.devices.push(deviceobj)
      arrayUtils.sortByProperty(this.devices, 'name')

      this.approuter.use(`/device/${name}`, deviceobj.approuter)
      logger.debug(`[Platform] Device created ${this.GetCode()}.${type}=${name}`)
      return deviceobj
    } catch (err) {
      logger.error(`[Platform] Cannot create device because '${err.message}'`)
    }
  }

  async StopAndRemoveDevice(id) {
    try {
      for (let i = 0; i < this.devices.length; i++) {
        const device = this.devices[i]
        if (device.id === id) {
          await device.Stop()
          global.app.remove(device.approuter, this.approuter)
          this.devices.splice(i, 1)
          logger.debug(`[Platform] Device deleted ${this.GetCode()}`)
          break
        }
      }
    } catch (err) {
      logger.error(`[Platform] Cannot delete device because '${err.message}'`)
    }
  }

  GetAutoDiscoveredDevices() {
    const typeselect = {}
    const types = PresenceDevice.GetTypes()
    for (const type of Object.keys(types)) {
      if (!['Human'].includes(type)) { typeselect[type] = types[type].displayname.replace(' ', '&nbsp;') }
    }

    const result = []
    for (const macaddress of Object.keys(this.macaddresses)) {
      let exists = false
      for (const device of this.devices) {
        if (device instanceof PresenceDevice) {
          if (device.setting.macaddress === macaddress) { exists = true }
        }
      }
      if (!exists) {
        result.push({
          type: JSON.stringify(typeselect).replace(/["]/g, "'"),
          displayname: this.macaddresses[macaddress] || 'Unknown',
          badge: macaddress,
          devicename: 'PresenceMachine'.toLowerCase(),
          icon: 'fa fa-question',
          setting: JSON.stringify({ macaddress: macaddress }).replace(/["]/g, "'")
        })
      }
    }
    return result
  }

  WebMainPage(req, res, next) {
    const maxitemswithoutgrouping = 6

    arrayUtils.sortByProperty(this.devices, 'name')
    const devicegroups = this.devices.length > maxitemswithoutgrouping ? arrayUtils.groupByFn(this.devices, (device) => device.constructor.name.replace('Presence', ''), { itemsortproperty: 'name' }) : null

    res.render('platforms/presence/main', {
      title: 'Presence platform',
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: PresenceDevice.GetTypes(),
      autodevices: this.GetAutoDiscoveredDevices()
    })
  }

  async WebAddDevice(req, res, next) {
    const type = req.body.type
    const name = req.body.name.toLowerCase()
    const settings = req.body.settings

    if (!Device.IsValidDeviceName(name)) { return res.status(http500).send(`Invalid device name: '${name}`) }

    const id = await DeviceModel.InsertSync(name, this.GetCode(), type)

    const deviceobj = await this.CreateAndStartDevice(type, id, name)

    if (settings) {
      for (const key of Object.keys(settings)) { deviceobj.AdaptSetting(key, settings[key]) }
    }

    res.send(name)
  }

  async WebDeleteDevice(req, res, next) {
    const id = Number.parseInt(req.body.id)

    await DeviceModel.DeleteSync(id, this.GetCode())

    await this.StopAndRemoveDevice(id)

    res.send('OK')
  }

  static GetHandlerCount() { return Object.keys(PresenceDevice.GetTypes()).length }
  GetCode() { return PresencePlatform.GetCode() }
  GetName() { return PresencePlatform.GetName() }
  GetDescription() { return PresencePlatform.GetDescription() }
  static GetPriority() { return '100' }
  static GetCode() { return 'presence' }
  static GetName() { return 'Presence' }
  static GetDescription() { return 'Who is at home?' }
}
module.exports = PresencePlatform
