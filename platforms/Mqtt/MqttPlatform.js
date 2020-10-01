const mqttCli = require('../../lib/mqttCli');

const Device = require('../Device');
const Platform = require('../Platform');
const MqttModel = require('../../models/Mqtt');
const DeviceModel = require('../../models/Device');
const MqttDevice = require('./MqttDevice');
const logger = require('../../lib/logger');

class MqttPlatform extends Platform {
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

  setting = {
    netinterface: '',
    toDisplayList: function () {
      const result = {};
      return result;
    }.bind(this),
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
  Tick(seconds) {
    if (seconds % 60 != 0)
      return;

    super.Tick(seconds);
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
      MqttModel.InsertUnknownFormat(topic, message || null);
      return;
    }

    let messageobj = null;
    try { messageobj = JSON.parse(message) }
    catch { messageobj = null }

    let deviceid = null;
    for (const device of this.devices)
      if (messageobj) {
        if (device.ProcessMessageObj(topic, messageobj))
          deviceid = device.id;
      }
      else {
        if (device.ProcessMessage(topic, message))
          deviceid = device.id;
      }

    if (deviceid)
      MqttModel.Insert(deviceid, topic, message || null);
    else {
      logger.warn(`[Platform] No device found for mqtt message on ${topic}: ${message}`);
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

  GetAutoDiscoveredDevices() {
    const result = [];
    return result;
  }

  WebMainPage(req, res, next) {
    res.render('platforms/mqtt/main', {
      title: "MQTT platform",
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      handlers: MqttDevice.GetTypes(),
      autodevices: this.GetAutoDiscoveredDevices(),
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
  static GetPriority() { return 1 }
  static GetCode() { return 'mqtt' }
  static GetName() { return 'Mqtt' }
}
module.exports = MqttPlatform;
