const useragent = require('express-useragent');
const WebAccess = require.main.require('./models/WebAccess');

module.exports = (app) => {

  // log all request
  app.use(function (req, res, next) {

    const user = req.session && req.session.user ? req.session.user.id : null;
    const uri = req.originalUrl;
    const session = req.sessionID;
    const remoteip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const uadetect = useragent.parse(req.headers['user-agent'] || "");

    const uaresult = {};
    uaresult["platform"] = uadetect["platform"];
    uaresult["os"] = uadetect["os"];
    uaresult["browser"] = uadetect["browser"];
    uaresult["version"] = uadetect["version"];
    uaresult["isDesktop"] = uadetect["isDesktop"];
    uaresult["isTablet"] = uadetect["isTablet"];
    uaresult["isMobile"] = uadetect["isMobile"];

    const browser = JSON.stringify(uaresult);

    WebAccess.Insert(user, uri, session, remoteip, browser);

    return next();
  });

  // available items in all pages (GET)
  app.get('/*', function (req, res, next) {

    res.locals.moment = require('moment');

    res.locals.devices = {};
    res.locals.devices.all = context.GetDeviceList();
    res.locals.devices.online = res.locals.devices.all.filter(device => device.IsOnline) || [];
    res.locals.devices.offline = res.locals.devices.all.filter(device => !device.IsOnline) || [];

    return next();
  });

}
