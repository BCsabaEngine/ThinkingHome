const Device = require('../Device');
const Platform = require('../Platform');
const DeviceModel = require('../../models/Device');
const RfDevice = require('./RfDevice');
const logger = require('../../lib/logger');

class RfPlatform extends Platform {
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

  last5rfcode = [];
  GetStatusInfos() {
    let result = [];
    result.push({ message: 'Received', value: this.msgcounter.incoming || '0' });
    result.push({ message: 'Sent', value: this.msgcounter.outgoing || '0' });
    result.push({ message: 'Load', value: this.msgcounter.GetMinuteRatio() });

    if (this.last5rfcode.length) {
      result.push({ message: "" });
      result.push({ message: "Last RF codes" });
      for (const rfcode of this.last5rfcode)
        result.push({ message: '', value: rfcode, });
    }

    const statusinfos = super.GetStatusInfos();
    if (Array.isArray(statusinfos))
      for (const statusinfo of statusinfos)
        if (statusinfo.error || statusinfo.warning)
          result.push(statusinfo);
    return result;
  }

  SendRfCode(rfcode) {
    this.msgcounter.outgoing++;
    // this.mqtt.publish(topic, message, { retain: false });
  }

  OnReceiveRfCode(rfcode) {
    this.msgcounter.incoming++;

    this.last5rfcode.push(message);
    while (this.last5rfcode.length > 5)
      this.last5rfcode = this.last5rfcode.slice(1);
    wss.BroadcastToChannel(`platform_${this.GetCode()}`);

    for (const device of this.devices)
      if (device.ReceiveRfCode(rfcode))
        return true;

    return false;
  }

  async Start() {
    this.approuter.get('/', this.WebMainPage.bind(this));
    this.approuter.post('/adddevice', this.WebAddDevice.bind(this));
    this.approuter.post('/deletedevice', this.WebDeleteDevice.bind(this));
    this.approuter.post('/sendrfcode', this.WebSendRfCode.bind(this));

    for (const device of await DeviceModel.GetPlatformDevicesSync(this.GetCode()))
      await this.CreateAndStartDevice(device.Type, device.Id, device.Name);
    await super.Start();
    logger.info(`[Platform] ${this.constructor.name} started with ${this.devices.length} device(s)`);
  }
  async Stop() {
    // this.mqtt.off('message', this.OnMessage);
    // this.mqtt.end();
    await super.Stop();
  }

  async CreateAndStartDevice(type, id, name) {
    try {
      const deviceobj = RfDevice.CreateByType(type, id, this, name);
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

  async WebMainPage(req, res, next) {
    res.render('platforms/rf/main', {
      title: "RF platform",
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      handlers: RfDevice.GetTypes(),
      autodevices: null,
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

  async WebSendRfCode(req, res, next) {
    const rfcode = req.body.rfcode;

    this.SendRfCode(rfcode);

    res.send("OK");
  }

  static GetHandlerCount() { return Object.keys(RfDevice.GetTypes()).length; }
  GetCode() { return RfPlatform.GetCode(); }
  GetName() { return RfPlatform.GetName(); }
  static GetPriority() { return 1 }
  static GetCode() { return 'rf' }
  static GetName() { return 'Rf' }
}
module.exports = RfPlatform;
