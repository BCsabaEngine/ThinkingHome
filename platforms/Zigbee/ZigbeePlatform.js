const Device = require('../Device')
const Platform = require('../Platform')
const DeviceModel = require('../../models/Device')
const ZigbeeDevice = require('./ZigbeeDevice')
const arrayUtils = require('../../lib/arrayUtils')

const http500 = 500

class ZigbeePlatform extends Platform {
  setting = {
    toDisplayList: function () {
      const result = {}

      result.allowjoin = {
        type: 'button',
        title: 'Allow join',
        value: 'Allow',
        onexecute: function () { this.SendMessage('bridge/config/permit_join', 'true') }.bind(this)
      }
      result.denyjoin = {
        type: 'button',
        title: 'Deny join',
        value: 'Deny',
        onexecute: function () { this.SendMessage('bridge/config/permit_join', 'false') }.bind(this)
      }

      return result
    }.bind(this)
  };

  msgcounter = {
    incoming: 0,
    outgoing: 0,
    startdate: new Date().getTime(),
    GetMinuteRatio() {
      const now = new Date().getTime()
      const minutes = (now - this.startdate) / 1000 / 60
      if (minutes > 0) {
        const value = ((this.incoming + this.outgoing) / minutes).toFixed(0)
        return `${value} /min`
      }
      return '0 /min'
    }
  };

  bridgeVersion = '';
  bridgeCoordinatorType = '';
  bridgeCoordinatorRevision = '';
  bridgeLoglevel = '';
  bridgeNetworkChannel = '';
  bridgePermitjoin = undefined;

  GetStatusInfos() {
    const result = []
    result.push({ message: 'Received', value: this.msgcounter.incoming || '0' })
    result.push({ message: 'Sent', value: this.msgcounter.outgoing || '0' })
    result.push({ message: 'Load', value: this.msgcounter.GetMinuteRatio() })

    result.push({ message: '' })
    if (this.bridgeVersion) result.push({ message: 'Zigbe2mqtt version', value: `v${this.bridgeVersion}` })
    if (this.bridgeCoordinatorType) result.push({ message: 'Coordinator type', value: this.bridgeCoordinatorType })
    if (this.bridgeCoordinatorRevision) result.push({ message: 'Coordinator revision', value: this.bridgeCoordinatorRevision })
    if (this.bridgeLoglevel) result.push({ message: 'Log level', value: this.bridgeLoglevel })
    if (this.bridgeNetworkChannel) result.push({ message: 'Network', value: `ch ${this.bridgeNetworkChannel}` })
    if (this.bridgePermitjoin !== undefined) result.push({ message: 'Join to network', value: this.bridgePermitjoin ? 'Allowed' : 'Denied' })

    const statusinfos = super.GetStatusInfos()
    if (Array.isArray(statusinfos)) {
      result.push({ message: '' })
      for (const statusinfo of statusinfos) {
        if (statusinfo.error || statusinfo.warning) { result.push(statusinfo) }
      }
    }
    return result
  }

  SendMessage(topic, message) {
    this.msgcounter.outgoing++
    global.runningContext.zigbeeInterCom.SendZigbeeMqtt(topic, message)
  }

  OnMessage(topic, message) {
    this.msgcounter.incoming++
    const messagestr = message.toString()

    let messageobj = null
    if (messagestr && messagestr.startsWith('{')) { try { messageobj = JSON.parse(messagestr) } catch { messageobj = null } }

    console.log(topic)
    console.log(messageobj || message)

    if (topic.startsWith('bridge/')) {
      switch (topic) {
        case 'bridge/config':
          this.bridgeVersion = messageobj.version
          this.bridgeCoordinatorType = messageobj.coordinator.type
          this.bridgeCoordinatorRevision = messageobj.coordinator.meta.revision
          this.bridgeLoglevel = messageobj.log_level
          this.bridgeNetworkChannel = messageobj.network.channel
          this.bridgePermitjoin = messageobj.permit_join
          break
        default:
          break
      }
      return true
    }

    for (const device of this.devices) {
      if (messageobj) {
        if (device.ProcessMessageObj(topic, messageobj)) return true
      } else {
        if (device.ProcessMessage(topic, messagestr)) return true
      }
    }

    return false
  }

  async Start() {
    this.approuter.get('/', this.WebMainPage.bind(this))
    this.approuter.post('/adddevice', this.WebAddDevice.bind(this))
    this.approuter.post('/deletedevice', this.WebDeleteDevice.bind(this))

    for (const device of await DeviceModel.GetPlatformDevicesSync(this.GetCode())) { await this.CreateAndStartDevice(device.Type, device.Id, device.Name) }
    await super.Start()
    logger.info(`[Platform] ${this.constructor.name} started with ${this.devices.length} device(s)`)

    setTimeout(function () { this.SendMessage('bridge/config/permit_join', '') }.bind(this), 2 * 1000)
  }

  async CreateAndStartDevice(type, id, name) {
    try {
      const deviceobj = ZigbeeDevice.CreateByType(type, id, this, name)
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

  async GetAutoDiscoveredDevices() {
    const typeselect = {}
    const types = ZigbeeDevice.GetTypes()
    for (const type of Object.keys(types)) { typeselect[type] = types[type].displayname.replace(' ', '&nbsp;') }

    const result = []

    // TODO Autodiscover zigbee devices

    // for (const mqttdevice of await MqttModel.GetUnknownDevices(autodetectdevicedays)) {
    //   let exists = false
    //   for (const device of this.devices) {
    //     if (device.name === mqttdevice) { exists = true }
    //   }
    //   if (!exists) {
    //     result.push({
    //       type: JSON.stringify(typeselect).replace(/["]/g, "'"),
    //       displayname: mqttdevice,
    //       devicename: mqttdevice.toLowerCase(),
    //       icon: 'fa fa-question',
    //       setting: JSON.stringify({ name: mqttdevice }).replace(/["]/g, "'")
    //     })
    //   }
    // }
    return result
  }

  async WebMainPage(req, res, next) {
    const maxitemswithoutgrouping = 6

    arrayUtils.sortByProperty(this.devices, 'name')
    const devicegroups = this.devices.length > maxitemswithoutgrouping ? arrayUtils.groupByFn(this.devices, (device) => device.setting.toTitle(), 'name') : null

    res.render('platforms/zigbee/main', {
      title: 'MQTT platform',
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: ZigbeeDevice.GetTypes(),
      autodevices: await this.GetAutoDiscoveredDevices()
    })
  }

  async WebAddDevice(req, res, next) {
    const type = req.body.type
    const name = req.body.name.toLowerCase()
    const settings = req.body.settings

    if (!Device.IsValidDeviceName(name) || !name.startsWith('ieee_')) { return res.status(http500).send(`Invalid device name: ${name}`) }

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

  static GetHandlerCount() { return Object.keys(ZigbeeDevice.GetTypes()).length }
  GetCode() { return ZigbeePlatform.GetCode() }
  GetName() { return ZigbeePlatform.GetName() }
  GetDescription() { return ZigbeePlatform.GetDescription() }
  static GetPriority() { return '020' }
  static GetCode() { return 'zigbee' }
  static GetName() { return 'Zigbee' }
  static GetDescription() { return 'IoT messages over 2.4GHz' }
}
module.exports = ZigbeePlatform
