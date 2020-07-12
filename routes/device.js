const Device = require.main.require('./models/Device');
const DeviceCapability = require.main.require('./models/DeviceCapability');
const DeviceSys = require.main.require('./models/DeviceSys');
const DeviceEvent = require.main.require('./models/DeviceEvent');
const DeviceTele = require.main.require('./models/DeviceTele');
const DeviceStatSeries = require.main.require('./models/DeviceStatSeries');
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
        cmdcapabilitycomponents: cmdcapabilitycomponents,
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

    days = Math.max(1, Math.min(days, 30));

    const ctxdevice = global.context.devices[devicename];
    if (!ctxdevice)
      throw new Error(`Device ${devicename} not found in context`);

    const rows = await DeviceTele.GetByDeviceId(ctxdevice.Id, telename, days);

    const timeline = [];
    rows.forEach(row => timeline.push([row.DateTime.getTime(), row.Data]));

    const timelineConv =
      timelineConverter.reduceTimeline(
        timelineConverter.moveAverage(timeline, 30), 1920);

    res.send(JSON.stringify(timelineConv));
  });

  app.get('/device/:devicename/graph/stat/:statname/:days', async function (req, res) {
    const devicename = req.params.devicename;
    const statname = req.params.statname;
    let days = Number(req.params.days);

    days = Math.max(1, Math.min(days, 30));

    const ctxdevice = global.context.devices[devicename];
    if (!ctxdevice)
      throw new Error(`Device ${devicename} not found in context`);

    const rows = await DeviceStatSeries.GetByDeviceId(ctxdevice.Id, statname, days);

    const startdate = new Date();
    startdate.setDate(startdate.getDate() - days);

    rows.forEach(row => {
      if (row.DateTimeStart.getTime() < startdate.getTime())
        row.DateTimeStart = startdate;
    });

    const result = {
      timeline: [],
      time: '0:00',
      percent: 0,
    };

    let onminutes = 0;
    let allminutes = 0;
    rows.forEach(row => {
      result.timeline.push([row.DateTimeStart.getTime(), row.Data == 'on' ? 1 : 0]);
      result.timeline.push([row.DateTimeEnd.getTime() - 1, row.Data == 'on' ? 1 : 0]);
      if (row.Data == 'on')
        onminutes += row.Minute;
      allminutes += row.Minute;
    });

    if (allminutes > 0) {
      const m = onminutes % 60;
      const h = Math.floor(onminutes / 60);
      let d = 0;
      if (h >= 48) {
        d = Math.floor(h / 24);
        h = h - d * 24;
      }

      let time = '';
      if (d > 0)
        time += d.toString() + "d ";

      time += h.toString().padStart(1, '0') + "h ";
      time += m.toString().padStart(2, '0') + "m";

      result.time = time;
      result.percent = Math.round(100 * onminutes / allminutes);
    }

    res.send(JSON.stringify(result));
  });

}
