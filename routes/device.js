const Device = require.main.require('./models/Device');
const DeviceCapability = require.main.require('./models/DeviceCapability');
const DeviceSys = require.main.require('./models/DeviceSys');
const DeviceEvent = require.main.require('./models/DeviceEvent');
const DeviceTele = require.main.require('./models/DeviceTele');
const timelineConverter = require.main.require('./lib/timelineConverter');

module.exports = (app) => {

  app.get('/device/:devicename', async function (req, res, next) {
    const devicename = req.params.devicename;
    try {
      const device = await Device.FindByName(devicename);
      if (!device)
        throw new Error(`Device not found: ${devicename}`);

      const devicecapabilities = await DeviceCapability.GetByDeviceId(device.Id);
      const cmdcapabilitycomponents = DeviceCapability.GetCapabilityComponentByStatAndCmd(devicecapabilities);
      const telecapabilitycomponents = DeviceCapability.GetCapabilityComponentByTele(devicecapabilities);
      const devicesys = await DeviceSys.FindLastByDeviceId(device.Id);
      const devicelastevents = await DeviceEvent.GetLastByDeviceId(device.Id);
      const ctxdevice = global.context.devices[devicename];

      res.render('device', {
        title: device.DisplayName || device.Name,
        devicename: devicename,
        device: device,
        ctxdevice: ctxdevice,
        cmdcmdcapabilitycomponents: cmdcapabilitycomponents,
        telecapabilitycomponents: telecapabilitycomponents,
        devicesys: devicesys,
        devicecapabilities: devicecapabilities,
        devicelastevents: devicelastevents,
      });
    }
    catch (err) { next(err); }
  })

  app.post('/device/:devicename/:command/:message', function (req, res) {
    const devicename = req.params.devicename;
    const command = req.params.command;
    const message = req.params.message;

    const ctxdevice = global.context.devices[devicename];
    if (!ctxdevice)
      throw new Error(`Device ${devicename} not found in context`);

    ctxdevice.cmd(command, message);

    res.send("OK");
  });

  app.get('/device/:devicename/graph/tele/:telename/:days', async function (req, res) {
    const devicename = req.params.devicename;
    const telename = req.params.telename;
    let days = Number(req.params.days);

    days = Math.max(1, Math.min(days, 31));

    const ctxdevice = global.context.devices[devicename];
    if (!ctxdevice)
      throw new Error(`Device ${devicename} not found in context`);

    const rows = (await DeviceTele.GetLastByDeviceId(ctxdevice.Id, telename, days));

    const timeline = [];
    rows.forEach(row => timeline.push([row.DateTime.getTime(), row.Data]));

    const timelineAvg = timelineConverter.moveAverage(timeline, 30);

    res.send(JSON.stringify(timelineAvg));
  });

}
