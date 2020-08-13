const Pug = require('pug');
const Device = require.main.require('./models/Device');
const DeviceConfig = require.main.require('./models/DeviceConfig');
const DeviceCapability = require.main.require('./models/DeviceCapability');
const DeviceSys = require.main.require('./models/DeviceSys');
const DeviceEvent = require.main.require('./models/DeviceEvent');
const DeviceLog = require.main.require('./models/DeviceLog');
const DeviceStat = require.main.require('./models/DeviceStat');
const DeviceStatSeries = require.main.require('./models/DeviceStatSeries');
const DeviceTele = require.main.require('./models/DeviceTele');
const timelineConverter = require.main.require('./lib/timelineConverter');

module.exports = (app) => {

  app.get('/device/:devicename', function (req, res, next) {
    const devicename = req.params.devicename;
    Device.FindByName(devicename)
      .then(device => {

        if (!device) throw new Error(`Device '${devicename}' not found`);

        Promise
          .all([
            DeviceCapability.GetByDeviceId(device.Id),
            DeviceSys.FindLastByDeviceId(device.Id),
            DeviceEvent.GetLastByDeviceId(device.Id, 7),
            DeviceConfig.GetAllByDeviceId(device.Id),
          ])
          .then(([devicecapabilities, devicesys, devicelastevents, deviceconfigs]) => {

            const statcapabilitycomponents = DeviceCapability.GetCapabilityComponentByStatAndCmd(devicecapabilities);
            const cmdonlycapabilitycomponents = DeviceCapability.GetCapabilityComponentByCmdOnly(devicecapabilities);
            const telecapabilitycomponents = DeviceCapability.GetCapabilityComponentByTele(devicecapabilities);
            const hasconfigcapability = DeviceCapability.HasConfigCapability(devicecapabilities);

            const ctxdevice = global.context.devices[devicename];
            if (!ctxdevice)
              throw new Error(`Device ${devicename} not found in context`);

            res.render('device', {
              title: device.DisplayName || device.Name,
              devicename: devicename,
              device: device,
              ctxdevice: ctxdevice,
              statcapabilitycomponents: statcapabilitycomponents,
              cmdonlycapabilitycomponents: cmdonlycapabilitycomponents,
              telecapabilitycomponents: telecapabilitycomponents,
              devicesys: devicesys,
              devicecapabilities: devicecapabilities,
              hasconfigcapability: hasconfigcapability,
              devicelastevents: devicelastevents,
              deviceconfigs: deviceconfigs,
            });

          });
      })
      .catch(err => { next(err); });
  })

  app.get('/device/:devicename/timeline', function (req, res, next) {
    const devicename = req.params.devicename;
    Device.FindByName(devicename)
      .then(device => {

        if (!device) throw new Error(`Device '${devicename}' not found`);

        Promise
          .all([
            DeviceEvent.GetAllByDeviceId(device.Id, 7),
            DeviceLog.GetAllByDeviceId(device.Id, 7),
            DeviceStatSeries.GetAllByDeviceId(device.Id, 7),
          ])
          .then(([deviceallevents, deviceallog, deviceallstatseries]) => {

            const allevents = [];
            deviceallevents.forEach(e => allevents.push({ Priority: 1, DateTime: e.DateTime, Icon: 'fa-bolt', IconBg: 'green', Event: e.Event, Data: e.Data }));
            deviceallog.forEach(l => allevents.push({ Priority: 3, DateTime: l.DateTime, Icon: 'fa-wrench', IconBg: 'warning', Event: l.Message, Data: null }));
            deviceallstatseries.forEach(s => allevents.push({ Priority: 2, DateTime: s.DateTimeStart, Icon: 'fa-cogs', IconBg: 'primary', Event: s.Stat, Data: s.Data }));

            allevents.sort(function (a, b) {
              let result = b.DateTime.getTime() - a.DateTime.getTime();
              if (!result)
                result = b.Priority - a.Priority;
              return result;
            });

            res.render('device-timeline', {
              title: "Timeline of " + (device.DisplayName || device.Name),
              devicename: devicename,
              device: device,
              allevents: timelineConverter.groupByDay(allevents),
            });
          });
      })
      .catch(err => { next(err); });
  })

  app.post('/device/:devicename/setdisplayname', function (req, res, next) {
    const devicename = req.params.devicename;
    const displayname = (req.body.displayname || "").trim();

    Device.FindByName(devicename)
      .then(device => {

        if (!device) throw new Error(`Device '${devicename}' not found`);

        return Device.SetDisplayName(devicename, displayname);
      })
      .then(() => { return context.ReInitDevices(); })
      .then(() => { res.json('success'); })
      .catch(err => { next(err); });
  });

  app.post('/device/:devicename/delete', function (req, res, next) {
    const devicename = req.params.devicename;

    Device.FindByName(devicename)
      .then(device => {

        if (!device) throw new Error(`Device '${devicename}' not found`);

        return Device.Delete(devicename);
      })
      .then(() => { return context.ReInitDevices(); })
      .then(() => { res.json('success'); })
      .catch(err => { next(err); });
  });

  app.get('/device/form/config/add', function (req, res, next) {
    try {
      const form = Pug.compileFile('views/forms/device-config-add.pug', {})({});
      res.send(form);
    }
    catch (err) { next(err); }
  })

  app.get('/device/form/config/modify', function (req, res, next) {
    try {
      const form = Pug.compileFile('views/forms/device-config-modify.pug', {})({});
      res.send(form);
    }
    catch (err) { next(err); }
  })

  app.post('/device/:devicename/config/add', function (req, res, next) {
    const devicename = req.params.devicename;
    const name = (req.body.name || "").trim().toUpperCase();
    const value = (req.body.value || "").trim();

    Device.FindByName(devicename)
      .then(device => {

        if (!device) throw new Error(`Device '${devicename}' not found`);

        return DeviceConfig.Insert(device.Id, name, value)
      })
      .then(() => { res.json('success'); })
      .catch(err => { next(err); });
  });

  app.post('/device/:devicename/config/modify', function (req, res, next) {
    const devicename = req.params.devicename;
    const id = req.body.id;
    const value = (req.body.value || "").trim();

    Device.FindByName(devicename)
      .then(device => {

        if (!device) throw new Error(`Device '${devicename}' not found`);

        return DeviceConfig.Update(device.Id, id, value)
      })
      .then(() => { res.json('success'); })
      .catch(err => { next(err); });
  });

  app.post('/device/:devicename/config/delete', function (req, res, next) {
    const devicename = req.params.devicename;
    const id = req.body.id;

    Device.FindByName(devicename)
      .then(device => {

        if (!device) throw new Error(`Device '${devicename}' not found`);

        return DeviceConfig.Delete(device.Id, id)
      })
      .then(() => { res.json('success'); })
      .catch(err => { next(err); });
  });

  app.post('/device/:devicename/config/push', function (req, res, next) {
    const devicename = req.params.devicename;

    try {
      const ctxdevice = global.context.devices[devicename];
      if (!ctxdevice)
        throw new Error(`Device ${devicename} not found in context`);

      ctxdevice.SendTimeAndConfig();

      res.json('success');
    }
    catch (err) { next(err); }
  });

  app.post('/device/:devicename/:command', function (req, res, next) {
    const devicename = req.params.devicename;
    const command = req.params.command;
    const message = (req.body.command || "").trim();

    try {
      const ctxdevice = global.context.devices[devicename];
      if (!ctxdevice)
        throw new Error(`Device ${devicename} not found in context`);

      ctxdevice.cmd(command, message);

      res.json('success');
    }
    catch (err) { next(err); }
  });

  app.get('/device/:devicename/graph/tele/:telename/:days', function (req, res, next) {
    const devicename = req.params.devicename;
    const telename = req.params.telename;
    let days = Number(req.params.days);

    days = Math.max(1, Math.min(days, 30));

    Device.FindByName(devicename)
      .then(device => {

        if (!device) throw new Error(`Device '${devicename}' not found`);

        return DeviceTele.GetByDeviceId(device.Id, telename, days);
      })
      .then(rows => {
        let timeline = [];
        rows.forEach(row => timeline.push([row.DateTime.getTime(), row.Data]));

        timeline = timelineConverter.moveAverage(timeline, 30);
        timeline = timelineConverter.reduceTimeline(timeline, 1920);

        res.send(JSON.stringify(timeline));
      })
      .catch(err => { next(err); });
  });

  app.get('/device/:devicename/graph/stat/:statname/:days', function (req, res, next) {
    const devicename = req.params.devicename;
    const statname = req.params.statname;
    let days = Number(req.params.days);

    days = Math.max(1, Math.min(days, 30));

    Device.FindByName(devicename)
      .then(device => {

        if (!device) throw new Error(`Device '${devicename}' not found`);

        return DeviceStatSeries.GetByDeviceId(device.Id, statname, days);
      })
      .then(rows => {
        const startdate = new Date();
        startdate.setTime(startdate.getTime() - days * 86400000);

        rows = DeviceStatSeries.NormalizeByStartDate(rows, startdate);
        const stat = DeviceStatSeries.GenerateTimelineStat(rows);

        res.send(JSON.stringify(stat));
      })
      .catch(err => { next(err); });
  });

}
