const si = require('systeminformation')
const Device = require('../Device')
const Platform = require('../Platform')
const DeviceModel = require('../../models/Device')
const RaspberryPiDevice = require('./RaspberryPiDevice')
const RaspberryPiDisk = require('./Devices/Disk')
const arrayUtils = require('../../lib/arrayUtils')

const http500 = 500

class RaspberryPiPlatform extends Platform {
  fssize = [];

  setting = {
    freshinterval: 60,

    toDisplayList: function () {
      const result = {}

      const intervallist = { 5: '5 seconds', 15: '15 seconds', 30: '30 seconds', 60: '1 minute', 120: '2 minutes', 300: '5 minutes', 600: '10 minutes' }
      result.freshinterval = {
        type: 'select',
        title: 'Refresh interval',
        value: this.setting.freshinterval,
        displayvalue: this.setting.freshinterval >= 60 ? `${this.setting.freshinterval / 60} minutes` : `${this.setting.freshinterval} seconds`,
        lookup: JSON.stringify(intervallist).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }

      return result
    }.bind(this)
  };

  Tick(seconds) {
    if (seconds % this.setting.freshinterval !== 0) { return }

    si
      .fsSize()
      .then(function (datas) {
        this.fssize = datas

        for (const device of this.devices) device.Tick(seconds)
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
      const deviceobj = RaspberryPiDevice.CreateByType(type, id, this, name)
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
    const result = []
    for (const fs of this.fssize) {
      if (!Number.isNaN(fs.size) && !Number.isNaN(fs.used)) {
        let exists = false
        for (const device of this.devices) {
          if (device instanceof RaspberryPiDisk) {
            if (device.setting.diskname === fs.fs) { exists = true }
          }
        }
        if (!exists) {
          result.push({
            type: 'Disk',
            displayname: 'Disk',
            badge: fs.fs,
            devicename: 'RPiDisk'.toLowerCase(),
            icon: 'fa fa-hdd',
            setting: JSON.stringify({ diskname: fs.fs }).replace(/["]/g, "'")
          })
        }
      }
    }
    return result
  }

  WebMainPage(req, res, next) {
    const maxitemswithoutgrouping = 6

    arrayUtils.sortByProperty(this.devices, 'name')
    const devicegroups = this.devices.length > maxitemswithoutgrouping ? arrayUtils.groupByFn(this.devices, (device) => device.constructor.name, { itemsortproperty: 'name' }) : null

    res.render('platforms/raspberrypi/main', {
      title: 'RaspberryPI platform',
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: RaspberryPiDevice.GetTypes(),
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

  static GetHandlerCount() { return Object.keys(RaspberryPiDevice.GetTypes()).length }
  GetCode() { return RaspberryPiPlatform.GetCode() }
  GetName() { return RaspberryPiPlatform.GetName() }
  GetDescription() { return RaspberryPiPlatform.GetDescription() }
  static GetPriority() { return '999' }
  static GetCode() { return 'raspberrypi' }
  static GetName() { return 'Raspberry PI' }
  static GetDescription() { return 'Where the miracle happens' }
}
module.exports = RaspberryPiPlatform
