const mqttCli = require('../../lib/mqttCli');

const Device = require('../Device');
const Platform = require('../Platform');
const MqttModel = require('../../models/Mqtt');
const DeviceModel = require('../../models/Device');
const MqttDevice = require('./MqttDevice');
const logger = require('../../lib/logger');

class MqttPlatform extends Platform {
  ZIGBEE_BASETOPIC = 'zigbee2mqtt';

  setting = {
    zigbee2mqtt: false,
    zigbee_basetopic: '',

    log_message_known: false,
    log_message_unknown: true,
    log_message_error: true,

    toDisplayList: function () {
      const result = {};

      result["zigbee2mqtt"] = {
        type: 'bool',
        title: 'Zigbee transmit over MQTT',
        value: this.setting.zigbee2mqtt ? "Enabled" : "Disabled",
        error: false,
        canclear: false,
      };

      if (this.setting.zigbee2mqtt)
        result["zigbee_basetopic"] = {
          type: 'text',
          title: 'Zigbee base topic',
          value: this.setting.zigbee_basetopic,
          displayvalue: function () { return this.setting.zigbee_basetopic || `${this.ZIGBEE_BASETOPIC} (default)`; }.bind(this)(),
          error: false,
          canclear: true,
        };

      result["log_message_known"] = {
        type: 'bool',
        title: 'Log processed MQTTs',
        value: this.setting.log_message_known ? "Log" : "Disabled",
        error: false,
        canclear: false,
      };

      result["log_message_unknown"] = {
        type: 'bool',
        title: 'Log MQTTs for unknown device',
        value: this.setting.log_message_unknown ? "Log" : "Disabled",
        error: false,
        canclear: false,
      };

      result["log_message_error"] = {
        type: 'bool',
        title: 'Log malformed MQTTs',
        value: this.setting.log_message_error ? "Log" : "Disabled",
        error: false,
        canclear: false,
      };

      return result;
    }.bind(this),
  };

  mqtt = null;
  msgcounter = {
    incoming: 0,
    outgoing: 0,
    startdate: new Date().getTime(),
    GetMinuteRatio() {
      const now = new Date().getTime();
      const minutes = (now - this.startdate) / 1000 / 60;
      if (minutes > 0) {
        const value = ((this.incoming + this.outgoing) / minutes).toFixed(0);
        return `${value} /min`;
      }
      return '0 /min';
    },
  };

  GetStatusInfos() {
    let result = [];
    if (!this.mqtt.connected)
      result.push({ error: true, message: 'Not connected to MQTT broker' });
    else {
      result.push({ message: 'Received', value: this.msgcounter.incoming || '0' });
      result.push({ message: 'Sent', value: this.msgcounter.outgoing || '0' });
      result.push({ message: 'Load', value: this.msgcounter.GetMinuteRatio() });
    }

    const statusinfos = super.GetStatusInfos();
    if (Array.isArray(statusinfos))
      for (const statusinfo of statusinfos)
        if (statusinfo.error || statusinfo.warning)
          result.push(statusinfo);
    return result;
  }

  SendMessage(topic, message) {
    this.msgcounter.outgoing++;
    if ((!!message) && (message.constructor === Object))
      message = JSON.stringify(message);
    this.mqtt.publish(topic, message, { retain: false });
  }

  OnMessage(topic, message) {
    this.msgcounter.incoming++;
    message = message.toString();

    const devicenamematch = topic.match(/^[a-zA-Z]*\/([0-9a-zA-Z_]*)\/?[0-9a-zA-Z_]*$/);
    if (!devicenamematch) {
      logger.warn(`[Platform] Invalid mqtt message on ${topic}: ${message}`);
      if (this.setting.log_message_error)
        MqttModel.InsertUnknownFormat(topic, message || null);
      return;
    }

    let messageobj = null;
    if (message && message.startsWith('{'))
      try { messageobj = JSON.parse(message) }
      catch { messageobj = null }

    let deviceid = null;
    for (const device of this.devices)
      if (!deviceid)
        if (messageobj) {
          if (device.ProcessMessageObj(topic, messageobj))
            deviceid = device.id;
        }
        else {
          if (device.ProcessMessage(topic, message))
            deviceid = device.id;
        }

    if (deviceid) {
      if (this.setting.log_message_known)
        MqttModel.Insert(deviceid, topic, message || null);
    }
    else {
      logger.warn(`[Platform] No device found for mqtt message on ${topic}: ${message}`);
      if (this.setting.log_message_unknown)
        MqttModel.InsertUnknownDevice(devicenamematch[1], topic, message || null);
    }
  }

  async Start() {
    this.mqtt = mqttCli();
    this.mqtt.on('message', this.OnMessage.bind(this));

    this.approuter.get('/', this.WebMainPage.bind(this));
    this.approuter.post('/adddevice', this.WebAddDevice.bind(this));
    this.approuter.post('/deletedevice', this.WebDeleteDevice.bind(this));

    for (const device of await DeviceModel.GetPlatformDevicesSync(this.GetCode()))
      await this.CreateAndStartDevice(device.Type, device.Id, device.Name);
    await super.Start();
    logger.info(`[Platform] ${this.constructor.name} started with ${this.devices.length} device(s)`);
  }
  async Stop() {
    this.mqtt.off('message', this.OnMessage);
    this.mqtt.end();
    await super.Stop();
  }

  async CreateAndStartDevice(type, id, name) {
    try {
      const deviceobj = MqttDevice.CreateByType(type, id, this, name);
      await deviceobj.Start();
      this.devices.push(deviceobj);
      this.approuter.use(`/device/${name}`, deviceobj.approuter);
      logger.debug(`[Platform] Device created ${this.GetCode()}.${type}=${name}`);
      return deviceobj;
    }
    catch (err) {
      console.log(err);
      logger.error(`[Platform] Cannot create device (${name}) because '${err.message}'`);
    }
  }
  async StopAndRemoveDevice(id) {
    try {
      for (let i = 0; i < this.devices.length; i++) {
        const device = this.devices[i];
        if (device.id == id) {
          await device.Stop();
          app.remove(device.approuter, this.approuter);
          this.devices.splice(i, 1);
          logger.debug(`[Platform] Device deleted ${this.GetCode()}.${type}=${name}`);
          break;
        }
      }
    }
    catch (err) {
      logger.error(`[Platform] Cannot delete device (${id}) because '${err.message}'`);
    }
  }

  async GetAutoDiscoveredDevices() {
    const typeselect = {};
    const types = MqttDevice.GetTypes();
    for (const type of Object.keys(types))
      typeselect[type] = types[type].displayname.replace(" ", "&nbsp;");

    const result = [];

    for (const mqttdevice of await MqttModel.GetUnknownDevices(6)) {
      let exists = false;
      for (const device of this.devices)
        if (device.name == mqttdevice)
          exists = true;
      if (!exists)
        result.push({
          type: JSON.stringify(typeselect).replace(/["]/g, "\'"),
          displayname: mqttdevice,
          devicename: mqttdevice.toLowerCase(),
          icon: 'fa fa-question',
          setting: JSON.stringify({ name: mqttdevice }).replace(/["]/g, "\'"),
        });
    }
    return result;
  }

  async WebMainPage(req, res, next) {
    res.render('platforms/mqtt/main', {
      title: "MQTT platform",
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      handlers: MqttDevice.GetTypes(),
      autodevices: await this.GetAutoDiscoveredDevices(),
    });
  }

  async WebAddDevice(req, res, next) {
    const type = req.body.type;
    const name = req.body.name.toLowerCase();
    const settings = req.body.settings;

    console.log(name);
    console.log(type);
    console.log(settings);

    if (!Device.IsValidDeviceName(name))
      return res.status(500).send(`Invalid device name: '${name}`);

    const id = await DeviceModel.InsertSync(name, this.GetCode(), type);

    const deviceobj = await this.CreateAndStartDevice(type, id, name);

    if (settings)
      for (const key of Object.keys(settings))
        deviceobj.AdaptSetting(key, settings[key]);

    res.send(name);
  }

  async WebDeleteDevice(req, res, next) {
    const id = req.body.id;

    await DeviceModel.DeleteSync(id, this.GetCode());

    await this.StopAndRemoveDevice(id);

    res.send("OK");
  }

  static GetHandlerCount() { return Object.keys(MqttDevice.GetTypes()).length; }
  GetCode() { return MqttPlatform.GetCode(); }
  GetName() { return MqttPlatform.GetName(); }
  GetDescription() { return MqttPlatform.GetDescription(); }
  static GetPriority() { return 1 }
  static GetCode() { return 'mqtt' }
  static GetName() { return 'Mqtt' }
  static GetDescription() { return 'IoT messages' }
}
module.exports = MqttPlatform;
