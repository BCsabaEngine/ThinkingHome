module.exports = (app) => {

  // function getMenuItems() {
  //   return [
  //     { name: "Ház", url: "/house/" },
  //     { name: "Kert", url: "/garden" },
  //   ];
  // }

  // available items in all pages (GET)
  app.get('/*', function (req, res, next) {

    res.locals.moment = require('moment');

    res.locals.devices = {};
    res.locals.devices.all = context.GetDeviceList();
    res.locals.devices.online = res.locals.devices.all.filter(device => device.IsOnline) || [];
    res.locals.devices.offline = res.locals.devices.all.filter(device => !device.IsOnline) || [];

    next();
  });

  app.get('/', function (req, res) {
    let tilehtml = "";
    // const tiles = context.GetDeviceTilePanels()
    // tiles.forEach((tile) => {
    //   tilehtml += `<div class="col-md-${tile.Size}">${tile.Html}</div>`;
    // });

    res.render('main', { title: "Dashboard", content: tilehtml, /*menuItems: getMenuItems(),*/ });
  })

  app.get('/device/:devicename', function (req, res) {
    const devicename = req.params.devicename;
    db.query("SELECT * FROM Device d WHERE d.Name = ? LIMIT 1", [devicename], function (err, devices) {
      if (err) throw err;

      const device = devices[0];

      db.query("SELECT dc.Value FROM DeviceCapability dc WHERE dc.Device = ? ORDER BY dc.Id", [device.Id], function (err, devicecapabilities) {
        if (err) throw err;

        if (devicecapabilities)
          devicecapabilities.forEach(devicecapability => {
            if (devicecapability.Value.includes(":")) {
              const parts = devicecapability.Value.split(":");
              devicecapability.Value = parts[0];
              devicecapability.Items = parts[1].split("/");
            }
          });

        db.query("SELECT * FROM DeviceSys ds WHERE ds.Device = ? ORDER BY ds.Id DESC LIMIT 1", [device.Id], function (err, devicesyses) {
          if (err) throw err;

          const devicesys = devicesyses ? devicesyses[0] : null;
          let devicesysid = 0;
          if (devicesys) {
            devicesysid = devicesys.Id;
            devicesys.DateTimeStr = devicesys.DateTime.toLocaleString();
            devicesys.ElapsedSec = Math.round((new Date() - devicesys.DateTime) / 1000);

            const nulldate = new Date(0);
            nulldate.setSeconds(devicesys.ElapsedSec);
            devicesys.ElapsedSecStr = nulldate.toISOString().substr(11, 8);
          }

          db.query("SELECT dsi.Name, dsi.Value FROM DeviceSysItem dsi WHERE dsi.DeviceSys = ? ORDER BY dsi.Name", [devicesysid], function (err, devicesysitems) {
            if (err) throw err;

            db.query("SELECT de.Event, de.Data, de.DateTime FROM DeviceEvent de WHERE de.Device = ? AND NOT EXISTS(SELECT 1 FROM DeviceEvent de2 WHERE de2.Device = de.Device AND de2.Event = de.Event AND de2.Id > de.Id) ORDER BY de.Event", [device.Id], function (err, devicelastevents) {
              if (err) throw err;

              let ctxdevice = null;
              if (ctxdevice = global.context.devices[devicename]) {
              }

              res.render('device', {
                title: device.DisplayName || device.Name,
                device: device,
                ctxdevice: ctxdevice,
                devicesys: devicesys,
                devicesysitems: devicesysitems,
                devicecapabilities: devicecapabilities,
                devicelastevents: devicelastevents,
              });

            });
          });
        });
      });
    });
    return;
    let tilehtml = "";
    // const tiles = context.GetDeviceTilePanels()
    // tiles.forEach((tile) => {
    //   tilehtml += `<div class="col-md-${tile.Size}">${tile.Html}</div>`;
    // });

    res.render('main', { title: "Dashboard", content: tilehtml, /*menuItems: getMenuItems(),*/ });

    res.render('main', { title: "Dashboard", content: tilehtml, /*menuItems: getMenuItems(),*/ });
  })
}
