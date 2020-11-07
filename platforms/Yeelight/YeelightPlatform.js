const Device = require('../Device')
const Platform = require('../Platform')
const DeviceModel = require('../../models/Device')
const YeelightDevice = require('./YeelightDevice')
const arrayUtils = require('../../lib/arrayUtils')
const { YeelightScanner } = require('../../lib/yeelight')

const http500 = 500

class YeelightPlatform extends Platform {
  setting = {
    toDisplayList: function () {
      const result = {}

      result.listdevices = {
        type: 'button',
        title: 'Discover devices',
        value: 'Refresh list',
        onexecute: function () {
          this.newdevices = {}
          this.scanner.Scan(this.newdevices)
        }.bind(this)
      }

      return result
    }.bind(this)
  };

  GetStatusInfos() {
    let result = []
    const statusinfos = super.GetStatusInfos()
    if (Array.isArray(statusinfos)) { result = result.concat(statusinfos) }
    return result
  }

  scanner = new YeelightScanner();
  newdevices = {};

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
      const deviceobj = YeelightDevice.CreateByType(type, id, this, name)
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

  async GetAutoDiscoveredDevices() {
    const typeselect = {}
    const types = YeelightDevice.GetTypes()
    for (const type of Object.keys(types)) { typeselect[type] = types[type].displayname.replace(' ', '&nbsp;') }

    const result = []
    if (this.newdevices) {
      for (const host of Object.keys(this.newdevices)) {
        let exists = false
        for (const device of this.devices) {
          if (device.setting && device.setting.host === host) exists = true
        }
        if (!exists) {
          const newdevice = this.newdevices[host]
          result.push({
            type: JSON.stringify(typeselect).replace(/["]/g, "'"),
            displayname: `${newdevice.model} (${newdevice.type})`,
            devicename: `yeelight _${newdevice.model}`,
            icon: 'fa fa-question',
            setting: JSON.stringify({ host: host }).replace(/["]/g, "'")
          })
        }
      }
    }

    return result
  }

  async WebMainPage(req, res, next) {
    const maxitemswithoutgrouping = 6

    arrayUtils.sortByProperty(this.devices, 'name')
    const devicegroups = this.devices.length > maxitemswithoutgrouping ? arrayUtils.groupByFn(this.devices, (device) => device.constructor.name.replace('Presence', ''), 'name') : null

    res.render('platforms/yeelight/main', {
      title: 'Yeelight platform',
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: YeelightDevice.GetTypes(),
      autodevices: await this.GetAutoDiscoveredDevices()
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
    const id = req.body.id

    await DeviceModel.DeleteSync(id, this.GetCode())

    await this.StopAndRemoveDevice(id)

    res.send('OK')
  }

  static GetHandlerCount() { return Object.keys(YeelightDevice.GetTypes()).length }
  GetCode() { return YeelightPlatform.GetCode() }
  GetName() { return YeelightPlatform.GetName() }
  GetDescription() { return YeelightPlatform.GetDescription() }
  static GetPriority() { return '90' }
  static GetCode() { return 'yeelight' }
  static GetName() { return 'Yeelight' }
  static GetDescription() { return 'Yeelight illumination' }
}
module.exports = YeelightPlatform
