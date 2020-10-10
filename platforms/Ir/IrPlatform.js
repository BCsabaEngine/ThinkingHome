const Device = require('../Device');
const Platform = require('../Platform');
const DeviceModel = require('../../models/Device');
const IrDevice = require('./IrDevice');
const arrayUtils = require('../../lib/arrayUtils');

class IrPlatform extends Platform {
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

  last10ircodestatus = [];
  GetStatusInfos() {
    let result = [];

    // const recdevs = runningContext.irInterCom.GetReceiverDevices()
    // if (recdevs.length) {
    //   let rc = 1;
    //   for (const recdev of recdevs)
    //     result.push({ message: `Receiver #${rc++}`, value: recdev.name, });
    // }
    // else
    //   result.push({ message: `Receiver device not found`, value: '', });

    // const snddevs = runningContext.rfInterCom.GetSenderDevices()
    // if (snddevs.length) {
    //   let rs = 1;
    //   for (const snddev of snddevs)
    //     result.push({ message: `Sender #${rs++}`, value: snddev.name, });
    // }
    // else
    //   result.push({ message: `Sender device not found`, value: '', });

    result.push({ message: '', value: '' });
    result.push({ message: 'Received', value: this.msgcounter.incoming || '0' });
    result.push({ message: 'Sent', value: this.msgcounter.outgoing || '0' });
    result.push({ message: 'Load', value: this.msgcounter.GetMinuteRatio() });

    if (this.last10ircodestatus.length) {
      result.push({ message: "" });
      result.push({ message: "Last IR codes handled by platform" });
      for (const ircodestatus of this.last10ircodestatus)
        result.push(ircodestatus);
    }

    const statusinfos = super.GetStatusInfos();
    if (Array.isArray(statusinfos))
      for (const statusinfo of statusinfos)
        if (statusinfo.error || statusinfo.warning)
          result.push(statusinfo);
    return result;
  }

  SendIrCode(ircode) {
    this.msgcounter.outgoing++;
    runningContext.irInterCom.SendIr(ircode);
  }

  OnReceiveIrCode(ircode) {
    this.msgcounter.incoming++;

    let found = false;
    for (const device of this.devices)
      if (device.ReceiveIrCode(ircode)) {
        found = true;
        break;
      }

    if (!found)
      this.last10ircodestatus.push({ message: 'Not handled', value: ircode });
    else
      this.last10ircodestatus.push({ message: '', value: ircode });

    while (this.last10ircodestatus.length > 10)
      this.last10ircodestatus = this.last10ircodestatus.slice(1);
    wss.BroadcastToChannel(`platform_${this.GetCode()}`);

    return found;
  }

  async Start() {
    this.approuter.get('/', this.WebMainPage.bind(this));
    this.approuter.post('/adddevice', this.WebAddDevice.bind(this));
    this.approuter.post('/deletedevice', this.WebDeleteDevice.bind(this));
    this.approuter.post('/sendircode', this.WebSendIrCode.bind(this));

    for (const device of await DeviceModel.GetPlatformDevicesSync(this.GetCode()))
      await this.CreateAndStartDevice(device.Type, device.Id, device.Name);
    await super.Start();
    logger.info(`[Platform] ${this.constructor.name} started with ${this.devices.length} device(s)`);
  }

  async CreateAndStartDevice(type, id, name) {
    try {
      const deviceobj = IrDevice.CreateByType(type, id, this, name);
      await deviceobj.Start();
      this.devices.push(deviceobj);
      arrayUtils.sortByProperty(this.devices, 'name');

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
    arrayUtils.sortByProperty(this.devices, 'name');
    const devicegroups = this.devices.length > 6 ? arrayUtils.groupByFn(this.devices, (device) => device.setting.toTitle(), 'name') : null;

    res.render('platforms/ir/main', {
      title: "IR platform",
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: IrDevice.GetTypes(),
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

  async WebSendIrCode(req, res, next) {
    const ircode = req.body.ircode;

    this.SendIrCode(ircode);

    res.send("OK");
  }

  static GetHandlerCount() { return Object.keys(IrDevice.GetTypes()).length; }
  GetCode() { return IrPlatform.GetCode(); }
  GetName() { return IrPlatform.GetName(); }
  GetDescription() { return IrPlatform.GetDescription(); }
  static GetPriority() { return 11 }
  static GetCode() { return 'ir' }
  static GetName() { return 'Ir' }
  static GetDescription() { return 'InfraRed' }
}
module.exports = IrPlatform;
