const mqttCli = require('../../lib/mqttCli')

const Device = require('../Device')
const Platform = require('../Platform')
const MqttModel = require('../../models/Mqtt')
const DeviceModel = require('../../models/Device')
const MqttDevice = require('./MqttDevice')
const arrayUtils = require('../../lib/arrayUtils')

const http500 = 500
const autodetectdevicedays = 6

class MqttPlatform extends Platform {
  ZIGBEE_BASETOPIC = 'zigbee2mqtt';

  setting = {
    zigbee2mqtt: false,
    zigbee_basetopic: '',

    log_message_known: false,
    log_message_unknown: true,
    log_message_error: true,

    toDisplayList: function () {
      const result = {}

      result.zigbee2mqtt = {
        type: 'bool',
        title: __('Zigbee transmit over MQTT'),
        value: this.setting.zigbee2mqtt ? __('Enabled') : __('Disabled'),
        error: false,
        canclear: false
      }

      if (this.setting.zigbee2mqtt) {
        result.zigbee_basetopic = {
          type: 'text',
          title: __('Zigbee base topic'),
          value: this.setting.zigbee_basetopic,
          displayvalue: function () { return this.setting.zigbee_basetopic || `${this.ZIGBEE_BASETOPIC} (default)` }.bind(this)(),
          error: false,
          canclear: true
        }
      }

      result.log_message_known = {
        type: 'bool',
        title: __('Log processed MQTTs'),
        value: this.setting.log_message_known ? __('Enabled') : __('Disabled'),
        error: false,
        canclear: false
      }

      result.log_message_unknown = {
        type: 'bool',
        title: __('Log MQTTs for unknown device'),
        value: this.setting.log_message_unknown ? __('Enabled') : __('Disabled'),
        error: false,
        canclear: false
      }

      result.log_message_error = {
        type: 'bool',
        title: __('Log malformed MQTTs'),
        value: this.setting.log_message_error ? __('Enabled') : __('Disabled'),
        error: false,
        canclear: false
      }

      return result
    }.bind(this)
  };

  mqtt = null;
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

  GetStatusInfos() {
    const result = []
    if (!this.mqtt.connected) { result.push({ error: true, message: __('Not connected to MQTT broker') }) } else {
      result.push({ message: __('Received'), value: this.msgcounter.incoming || '0' })
      result.push({ message: __('Sent'), value: this.msgcounter.outgoing || '0' })
      result.push({ message: __('Load'), value: this.msgcounter.GetMinuteRatio() })
    }

    const statusinfos = super.GetStatusInfos()
    if (Array.isArray(statusinfos)) {
      for (const statusinfo of statusinfos) {
        if (statusinfo.error || statusinfo.warning) { result.push(statusinfo) }
      }
    }
    return result
  }

  SendZigbeeMessage(topic, message) {
    const zigbeeprefix = (this.setting.zigbee_basetopic || this.ZIGBEE_BASETOPIC) + '/'
    this.SendMessage(zigbeeprefix + topic, message)
  }

  SendMessage(topic, message) {
    this.msgcounter.outgoing++
    if ((!!message) && (message.constructor === Object)) {
      this.mqtt.publish(topic, JSON.stringify(message), { retain: false })
    } else {
      this.mqtt.publish(topic, message, { retain: false })
    }
  }

  OnMessage(topic, message) {
    this.msgcounter.incoming++
    const messagestr = message.toString()

    if (topic.startsWith('tasmota/discovery/')) return

    const zigbeeprefix = (this.setting.zigbee_basetopic || this.ZIGBEE_BASETOPIC) + '/'

    if (topic.startsWith(zigbeeprefix)) {
      if (this.setting.zigbee2mqtt) {
        global.runningContext.zigbeeInterCom.ZigbeeMqttReceived(topic.substr(zigbeeprefix.length), message)
      }
      return
    }

    const devicenamematch = topic.match(/^[a-zA-Z]*\/([0-9a-zA-Z_]*)\/?[0-9a-zA-Z_]*$/)
    if (!devicenamematch) {
      logger.warn(`[Platform] Invalid mqtt message on ${topic}: ${messagestr}`)
      if (this.setting.log_message_error) { MqttModel.InsertUnknownFormat(topic, messagestr || null) }
      return
    }

    let messageobj = null
    if (messagestr && messagestr.startsWith('{')) { try { messageobj = JSON.parse(messagestr) } catch { messageobj = null } }

    let deviceid = null
    for (const device of this.devices) {
      if (!deviceid) {
        if (messageobj) {
          if (device.ProcessMessageObj(topic, messageobj)) { deviceid = device.id }
        } else {
          if (device.ProcessMessage(topic, messagestr)) { deviceid = device.id }
        }
      }
    }

    if (deviceid) {
      if (this.setting.log_message_known) { MqttModel.Insert(deviceid, topic, messagestr || null) }
    } else {
      logger.warn(`[Platform] No device found for mqtt message on ${topic}: ${messagestr}`)
      if (this.setting.log_message_unknown) { MqttModel.InsertUnknownDevice(devicenamematch[1], topic, messagestr || null) }
    }
  }

  async Start() {
    this.mqtt = mqttCli()

    this.approuter.get('/', this.WebMainPage.bind(this))
    this.approuter.post('/adddevice', this.WebAddDevice.bind(this))
    this.approuter.post('/deletedevice', this.WebDeleteDevice.bind(this))

    for (const device of await DeviceModel.GetPlatformDevicesSync(this.GetCode())) { await this.CreateAndStartDevice(device.Type, device.Id, device.Name) }

    this.mqtt.on('message', this.OnMessage.bind(this))

    await super.Start()
    logger.info(`[Platform] ${this.constructor.name} started with ${this.devices.length} device(s)`)
  }

  async Stop() {
    this.mqtt.off('message', this.OnMessage)
    this.mqtt.end()
    await super.Stop()
  }

  async CreateAndStartDevice(type, id, name) {
    try {
      const deviceobj = MqttDevice.CreateByType(type, id, this, name)
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
    const types = MqttDevice.GetTypes()
    for (const type of Object.keys(types)) { typeselect[type] = types[type].displayname.replace(' ', '&nbsp;') }

    const result = []

    for (const mqttdevice of await MqttModel.GetUnknownDevices(autodetectdevicedays)) {
      let exists = false
      for (const device of this.devices) {
        if (device.name === mqttdevice) { exists = true }
      }
      if (!exists) {
        result.push({
          type: JSON.stringify(typeselect).replace(/["]/g, "'"),
          displayname: mqttdevice,
          devicename: mqttdevice.toLowerCase(),
          icon: 'fa fa-question',
          setting: JSON.stringify({ name: mqttdevice }).replace(/["]/g, "'")
        })
      }
    }
    return result
  }

  async WebMainPage(req, res, next) {
    const maxitemswithoutgrouping = 6

    arrayUtils.sortByProperty(this.devices, 'name')
    const devicegroups = this.devices.length > maxitemswithoutgrouping ? arrayUtils.groupByFn(this.devices, (device) => device.setting.toTitle(), { itemsortproperty: 'name' }) : null

    res.render('platforms/mqtt/main', {
      title: 'MQTT platform',
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: MqttDevice.GetTypes(),
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
    const id = Number.parseInt(req.body.id)

    await DeviceModel.DeleteSync(id, this.GetCode())

    await this.StopAndRemoveDevice(id)

    res.send('OK')
  }

  static GetHandlerCount() { return Object.keys(MqttDevice.GetTypes()).length }
  GetCode() { return MqttPlatform.GetCode() }
  GetName() { return MqttPlatform.GetName() }
  GetDescription() { return MqttPlatform.GetDescription() }
  static GetPriority() { return '001' }
  static GetCode() { return 'mqtt' }
  static GetName() { return 'Mqtt' }
  static GetDescription() { return 'IoT messages over network' }
}
module.exports = MqttPlatform
