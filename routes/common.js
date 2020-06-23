module.exports = (app) => {

  // available items in all pages (GET)
  app.get('/*', function (req, res, next) {

    res.locals.moment = require('moment');

    res.locals.devices = {};
    res.locals.devices.all = context.GetDeviceList();
    res.locals.devices.online = res.locals.devices.all.filter(device => device.IsOnline) || [];
    res.locals.devices.offline = res.locals.devices.all.filter(device => !device.IsOnline) || [];

    next();
  });

}
