const Pug = require('pug');
const Device = require.main.require('./models/Device');
const DeviceConfig = require.main.require('./models/DeviceConfig');
const DeviceCapability = require.main.require('./models/DeviceCapability');
const DeviceSys = require.main.require('./models/DeviceSys');
const DeviceEvent = require.main.require('./models/DeviceEvent');
const DeviceTele = require.main.require('./models/DeviceTele');
const DeviceStatSeries = require.main.require('./models/DeviceStatSeries');
const timelineConverter = require.main.require('./lib/timelineConverter');

module.exports = (app) => {

  app.get('/device/:devicename', function (req, res, next) {
    const devicename = req.params.devicename;
    Device.FindByName(devicename)
      .then(device => {
        DeviceCapability.GetByDeviceId(device.Id)
          .then(devicecapabilities => {
            const cmdcapabilitycomponents = DeviceCapability.GetCapabilityComponentByStatAndCmd(devicecapabilities);
            const telecapabilitycomponents = DeviceCapability.GetCapabilityComponentByTele(devicecapabilities);

            DeviceSys.FindLastByDeviceId(device.Id)
              .then(devicesys => {
                DeviceEvent.GetLastByDeviceId(device.Id)
                  .then(devicelastevents => {
                    DeviceConfig.GetAllByDeviceId(device.Id)
                      .then(deviceconfigs => {
                        const ctxdevice = global.context.devices[devicename];
                        if (!ctxdevice)
                          throw new Error(`Device ${devicename} not found in context`);

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
                          deviceconfigs: deviceconfigs,
                        });

                      });
                  });
              });
          });
      })
      .catch(err => { next(err); });
  })

  app.get('/device/:devicename/events', function (req, res, next) {
    const devicename = req.params.devicename;
    Device.FindByName(devicename)
      .then(device => {
        DeviceEvent.GetAllByDeviceId(device.Id)
          .then(deviceallevents => {
            res.render('device-events', {
              title: "Events of " + (device.DisplayName || device.Name),
              devicename: devicename,
              device: device,
              deviceallevents: timelineConverter.groupByDay(deviceallevents),
            });
          });
      })
      .catch(err => { next(err); });
  })

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

  app.post('/device/:devicename/config/add', function (req, res) {
    const devicename = req.params.devicename;
    const name = (req.body.name || "").trim();
    const value = (req.body.value || "").trim();

    Device.FindByName(devicename)
      .then(device => {
        DeviceConfig.Insert(device.Id, name, value)
      })
      .then(() => { res.json('success'); })
      .catch(err => { next(err); });
  });

  app.post('/device/:devicename/config/modify', function (req, res) {
    const devicename = req.params.devicename;
    const id = req.body.id;
    const value = (req.body.value || "").trim();

    Device.FindByName(devicename)
      .then(device => {
        DeviceConfig.Update(device.Id, id, value)
      })
      .then(() => { res.json('success'); })
      .catch(err => { next(err); });
  });

  app.post('/device/:devicename/config/delete', function (req, res) {
    const devicename = req.params.devicename;
    const id = req.body.id;

    Device.FindByName(devicename)
      .then(device => {
        DeviceConfig.Delete(device.Id, id)
      })
      .then(() => { res.json('success'); })
      .catch(err => { next(err); });
  });

  app.post('/device/:devicename/config/push', function (req, res) {
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

  app.post('/device/:devicename/:command/:message', function (req, res) {
    const devicename = req.params.devicename;
    const command = req.params.command;
    const message = req.params.message;

    try {
      const ctxdevice = global.context.devices[devicename];
      if (!ctxdevice)
        throw new Error(`Device ${devicename} not found in context`);

      ctxdevice.cmd(command, message);

      res.json('success');
    }
    catch (err) { next(err); }
  });

  app.get('/device/:devicename/graph/tele/:telename/:days', function (req, res) {
    const devicename = req.params.devicename;
    const telename = req.params.telename;
    let days = Number(req.params.days);

    days = Math.max(1, Math.min(days, 30));

    Device.FindByName(devicename)
      .then(device => DeviceTele.GetByDeviceId(device.Id, telename, days))
      .then(rows => {
        let timeline = [];
        rows.forEach(row => timeline.push([row.DateTime.getTime(), row.Data]));

        timeline = timelineConverter.moveAverage(timeline, 30);
        timeline = timelineConverter.reduceTimeline(timeline, 1920);

        res.send(JSON.stringify(timeline));
      })
      .catch(err => { next(err); });
  });

  app.get('/device/:devicename/graph/stat/:statname/:days', function (req, res) {
    const devicename = req.params.devicename;
    const statname = req.params.statname;
    let days = Number(req.params.days);

    days = Math.max(1, Math.min(days, 30));

    Device.FindByName(devicename)
      .then(device => DeviceStatSeries.GetByDeviceId(device.Id, statname, days))
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
