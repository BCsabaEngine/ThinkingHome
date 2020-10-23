const Device = require('../Device')
const Platform = require('../Platform')
const DeviceModel = require('../../models/Device')
const MediaDevice = require('./MediaDevice')
const arrayUtils = require('../../lib/arrayUtils')

const http500 = 500

class MediaPlatform extends Platform {
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
      const deviceobj = MediaDevice.CreateByType(type, id, this, name)
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

  WebMainPage(req, res, next) {
    const maxitemswithoutgrouping = 6

    arrayUtils.sortByProperty(this.devices, 'name')
    const devicegroups = this.devices.length > maxitemswithoutgrouping ? arrayUtils.groupByFn(this.devices, (device) => device.constructor.name.replace('Presence', ''), 'name') : null

    res.render('platforms/media/main', {
      title: 'Media platform',
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: MediaDevice.GetTypes(),
      autodevices: []
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

  static GetHandlerCount() { return Object.keys(MediaDevice.GetTypes()).length }
  GetCode() { return MediaPlatform.GetCode() }
  GetName() { return MediaPlatform.GetName() }
  GetDescription() { return MediaPlatform.GetDescription() }
  static GetPriority() { return '110' }
  static GetCode() { return 'media' }
  static GetName() { return 'Media' }
  static GetDescription() { return 'Entertainment systems' }
}
module.exports = MediaPlatform
