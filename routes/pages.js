module.exports = (app) => {

  // function getMenuItems() {
  //   return [
  //     { name: "Ház", url: "/house/" },
  //     { name: "Kert", url: "/garden" },
  //   ];
  // }

  // available items in all pages (GET)
  app.get('/*', function (req, res, next) {

    res.locals.devices = {};
    res.locals.devices.all = context.GetDeviceList();
    res.locals.devices.online = res.locals.devices.all.filter(device => device.IsOnline) || [];
    res.locals.devices.offline = res.locals.devices.all.filter(device => !device.IsOnline) || [];

    next();
  });

  app.get('/', function (req, res) {
    let tilehtml = "";
    const tiles = context.GetDeviceTilePanels()
    tiles.forEach((tile) => {
      tilehtml += `<div class="col-md-${tile.Size}">${tile.Html}</div>`;
    });

    res.render('main', { title: "Dashboard", content: tilehtml, /*menuItems: getMenuItems(),*/ });
  })
}
