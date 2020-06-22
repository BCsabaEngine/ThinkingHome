const Device = requireRoot('/models/Device');
const DeviceCapability = requireRoot('/models/DeviceCapability');
const DeviceSys = requireRoot('/models/DeviceSys');
const DeviceEvent = requireRoot('/models/DeviceEvent');

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

  app.get('/device/:devicename', async function (req, res, next) {
    const devicename = req.params.devicename;
    try {
      const device = await Device.FindByName(devicename);
      if (!device)
        throw new Error(`Device not found: ${devicename}`);

      const devicecapabilities = await DeviceCapability.GetByDeviceId(device.Id);
      const capabilitycomponents = DeviceCapability.GetCapabilityComponentByStatAndCmd(devicecapabilities);
      const devicesys = await DeviceSys.FindLastByDeviceId(device.Id);
      const devicelastevents = await DeviceEvent.GetLastByDeviceId(device.Id);
      const ctxdevice = global.context.devices[devicename];

      res.render('device', {
        title: device.DisplayName || device.Name,
        device: device,
        ctxdevice: ctxdevice,
        capabilitycomponents: capabilitycomponents,
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

}
