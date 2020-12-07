const Device = require('../Device')
const Platform = require('../Platform')
const DeviceModel = require('../../models/Device')
const IrDevice = require('./IrDevice')
const IrReceiverDevice = require('./IrReceiverDevice')
const IrSenderDevice = require('./IrSenderDevice')
const arrayUtils = require('../../lib/arrayUtils')

const http500 = 500
const lastircodecount = 10

class IrPlatform extends Platform {
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

  lastircodestatus = [];
  GetStatusInfos() {
    const result = []

    const recdevs = global.runningContext.irInterCom.GetReceiverDevices()
    if (recdevs.length) {
      let rc = 1
      for (const recdev of recdevs) {
        result.push({ message: __('Receiver #%s', rc++), value: recdev.name })
      }
    } else {
      result.push({ message: __('Receiver device not found'), value: '' })
    }

    const snddevs = global.runningContext.irInterCom.GetSenderDevices()
    if (snddevs.length) {
      let rc = 1
      for (const snddev of snddevs) {
        result.push({ message: __('Sender #%s', rc++), value: snddev.name })
      }
    } else {
      result.push({ message: __('Sender device not found'), value: '' })
    }

    result.push({ message: '', value: '' })
    result.push({ message: __('Received'), value: this.msgcounter.incoming || '0' })
    result.push({ message: __('Sent'), value: this.msgcounter.outgoing || '0' })
    result.push({ message: __('Load'), value: this.msgcounter.GetMinuteRatio() })

    if (this.lastircodestatus.length) {
      result.push({ message: '' })
      result.push({ message: __('Last IR codes handled by platform') })
      for (const ircodestatus of this.lastircodestatus) { result.push(ircodestatus) }
    }

    const statusinfos = super.GetStatusInfos()
    if (Array.isArray(statusinfos)) {
      for (const statusinfo of statusinfos) {
        if (statusinfo.error || statusinfo.warning) { result.push(statusinfo) }
      }
    }
    return result
  }

  SendIrCode(handlerdevice, ircode) {
    this.msgcounter.outgoing++
    global.runningContext.irInterCom.SendIr(handlerdevice, ircode)
  }

  OnReceiveIrCode(handlerdevice, ircode) {
    this.msgcounter.incoming++

    let found = false
    for (const device of this.devices) {
      if (device instanceof IrSenderDevice) {
        if (device.ReceiveIrCode(handlerdevice, ircode)) {
          found = true
          break
        }
      }
    }

    if (!found) {
      this.lastircodestatus.push({ message: __('Not handled'), value: ircode })
    } else {
      this.lastircodestatus.push({ message: '', value: ircode })
    }

    while (this.lastircodestatus.length > lastircodecount) { this.lastircodestatus = this.lastircodestatus.slice(1) }
    global.wss.BroadcastToChannel(`platform_${this.GetCode()}`)

    return found
  }

  async Start() {
    this.approuter.get('/', this.WebMainPage.bind(this))
    this.approuter.post('/adddevice', this.WebAddDevice.bind(this))
    this.approuter.post('/deletedevice', this.WebDeleteDevice.bind(this))
    this.approuter.post('/sendircode', this.WebSendIrCode.bind(this))

    for (const device of await DeviceModel.GetPlatformDevicesSync(this.GetCode())) { await this.CreateAndStartDevice(device.Type, device.Id, device.Name) }
    await super.Start()
    logger.info(`[Platform] ${this.constructor.name} started with ${this.devices.length} device(s)`)
  }

  async CreateAndStartDevice(type, id, name) {
    try {
      const deviceobj = IrDevice.CreateByType(type, id, this, name)
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

    res.render('platforms/ir/main', {
      title: 'IR platform',
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: IrDevice.GetTypes(),
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

  async WebSendIrCode(req, res, next) {
    const ircode = req.body.ircode

    this.SendIrCode(ircode)

    res.send('OK')
  }

  static GetHandlerCount() { return Object.keys(IrDevice.GetTypes()).length }
  GetCode() { return IrPlatform.GetCode() }
  GetName() { return IrPlatform.GetName() }
  GetDescription() { return IrPlatform.GetDescription() }
  static GetPriority() { return '011' }
  static GetCode() { return 'ir' }
  static GetName() { return 'Ir' }
  static GetDescription() { return 'InfraRed' }
}
module.exports = IrPlatform
