const Device = require('../Device')
const Platform = require('../Platform')
const DeviceModel = require('../../models/Device')
const RfDevice = require('./RfDevice')
const arrayUtils = require('../../lib/arrayUtils')

const http500 = 500
const lastrfcodecount = 10

class RfPlatform extends Platform {
  msgcounter = {
    incoming: 0,
    outgoing: 0,
    startdate: new Date().getTime(),
    GetMinuteRatio() {
      const now = new Date().getTime()
      const minutes = (now - this.startdate) / 1000 / 60
      if (minutes > 0) {
        const value = ((this.incoming + this.outgoing) / minutes).toFixed(0)
        return __('%s /min', value)
      }
      return __('0 /min')
    }
  };

  lastrfcodestatus = [];
  GetStatusInfos() {
    const result = []

    const recdevs = global.runningContext.rfInterCom.GetReceiverDevices()
    if (recdevs.length) {
      let rc = 1
      for (const recdev of recdevs) { result.push({ message: __('Receiver #%s', rc++), value: recdev.name }) }
    } else { result.push({ message: __('Receiver device not found'), value: '' }) }

    const snddevs = global.runningContext.rfInterCom.GetSenderDevices()
    if (snddevs.length) {
      let rs = 1
      for (const snddev of snddevs) { result.push({ message: __('Sender #%s', rs++), value: snddev.name }) }
    } else { result.push({ message: __('Sender device not found'), value: '' }) }

    result.push({ message: '', value: '' })
    result.push({ message: __('Received'), value: this.msgcounter.incoming || '0' })
    result.push({ message: __('Sent'), value: this.msgcounter.outgoing || '0' })
    result.push({ message: __('Load'), value: this.msgcounter.GetMinuteRatio() })

    if (this.lastrfcodestatus.length) {
      result.push({ message: '' })
      result.push({ message: __('Last RF codes handled by platform') })
      for (const rfcodestatus of this.lastrfcodestatus) { result.push(rfcodestatus) }
    }

    const statusinfos = super.GetStatusInfos()
    if (Array.isArray(statusinfos)) {
      for (const statusinfo of statusinfos) {
        if (statusinfo.error || statusinfo.warning) { result.push(statusinfo) }
      }
    }
    return result
  }

  SendRfCode(handlerdevice, rfcode) {
    this.msgcounter.outgoing++
    global.runningContext.rfInterCom.SendRf(handlerdevice, rfcode)
  }

  OnReceiveRfCode(rfcode) {
    this.msgcounter.incoming++

    let found = false
    for (const device of this.devices) {
      if (device.ReceiveRfCode(rfcode)) {
        found = true
        break
      }
    }

    if (!found) {
      this.lastrfcodestatus.push({ message: __('Not handled'), value: rfcode })
    } else {
      this.lastrfcodestatus.push({ message: '', value: rfcode })
    }

    while (this.lastrfcodestatus.length > lastrfcodecount) { this.lastrfcodestatus = this.lastrfcodestatus.slice(1) }
    global.wss.BroadcastToChannel(`platform_${this.GetCode()}`)

    return found
  }

  async Start() {
    this.approuter.get('/', this.WebMainPage.bind(this))
    this.approuter.post('/adddevice', this.WebAddDevice.bind(this))
    this.approuter.post('/deletedevice', this.WebDeleteDevice.bind(this))
    this.approuter.post('/sendrfcode', this.WebSendRfCode.bind(this))

    for (const device of await DeviceModel.GetPlatformDevicesSync(this.GetCode())) { await this.CreateAndStartDevice(device.Type, device.Id, device.Name) }
    await super.Start()
    logger.info(`[Platform] ${this.constructor.name} started with ${this.devices.length} device(s)`)
  }

  async CreateAndStartDevice(type, id, name) {
    try {
      const deviceobj = RfDevice.CreateByType(type, id, this, name)
      await deviceobj.Start()
      this.devices.push(deviceobj)
      arrayUtils.sortByProperty(this.devices, 'name')

      this.approuter.use(`/device/${name}`, deviceobj.approuter)
      logger.debug(`[Platform] Device created ${this.GetCode()}.${type}=${name}`)
      return deviceobj
    } catch (err) {
      logger.error(`[Platform] Cannot create device (${name}) because '${err.message}'`)
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
      logger.error(`[Platform] Cannot delete device (${id}) because '${err.message}'`)
    }
  }

  async WebMainPage(req, res, next) {
    const maxitemswithoutgrouping = 6

    arrayUtils.sortByProperty(this.devices, 'name')
    const devicegroups = this.devices.length > maxitemswithoutgrouping ? arrayUtils.groupByFn(this.devices, (device) => device.setting.toTitle(), { itemsortproperty: 'name' }) : null

    res.render('platforms/rf/main', {
      title: 'RF platform',
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: RfDevice.GetTypes(),
      autodevices: null
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

  async WebSendRfCode(req, res, next) {
    const rfcode = req.body.rfcode

    this.SendRfCode(null, rfcode)

    res.send('OK')
  }

  static GetHandlerCount() { return Object.keys(RfDevice.GetTypes()).length }
  GetCode() { return RfPlatform.GetCode() }
  GetName() { return RfPlatform.GetName() }
  GetDescription() { return RfPlatform.GetDescription() }
  static GetPriority() { return '010' }
  static GetCode() { return 'rf' }
  static GetName() { return 'Rf' }
  static GetDescription() { return 'Radio-frequency' }
}
module.exports = RfPlatform
