const glob = require('glob');
const path = require('path');
const favicon = require('serve-favicon');
const nGfirewall = require('../lib/nGfirewall');
const IpBlacklist = require('../lib/IpBlacklist');
const express = require('express');

module.exports = (app) => {

  // filter private and public banned IPs
  // app.use(IpBlacklist.check({
  //   blackLists: [
  //     "blacklist.txt",
  //     "https://sslbl.abuse.ch/blacklist/sslipblacklist.txt",
  //     "https://myip.ms/files/blacklist/general/latest_blacklist.txt",
  //   ],
  //   whiteListLifeTimeMs: 10 * 60 * 1000,
  //   onFailRequest: function (ipAddress) {
  //     require('fs').appendFile('banned.ips', ipAddress + require('os').EOL, 'utf8', () => { });
  //   }
  // }));

  // filter malicious requests
  // app.use(nGfirewall.check({
  //   onFailRequest: function (ipAddress, item, rule) {
  //     console.log("[nGfirewall] %s from %s matched %s", item, ipAddress, rule);
  //   }
  // }));

  app.use(express.static('public', { index: false, maxAge: '1h', redirect: false }));
  app.use('/dist', express.static('./node_modules/admin-lte/dist', { index: false, maxAge: '1h', redirect: false }));
  app.use('/plugins', express.static('./node_modules/admin-lte/plugins', { index: false, maxAge: '1h', redirect: false }));
  app.use('/material-icons', express.static('./node_modules/material-icons', { index: false, maxAge: '1h', redirect: false }));
  app.use('/sweetalert2', express.static('./node_modules/sweetalert2/dist', { index: false, maxAge: '1h', redirect: false }));
  app.use('/mousetrap', express.static('./node_modules/mousetrap', { index: false, maxAge: '1h', redirect: false }));
  app.use('/clipboard', express.static('./node_modules/clipboard/dist', { index: false, maxAge: '1h', redirect: false }));
  app.use(favicon(path.resolve('./public/favicon.ico')));

  // early loading of common and login routes
  require(path.resolve('./routes/common.js'))(app);
  //  require(path.resolve('./routes/login.js'))(app);

  // all other definition files
  for (const file of glob.sync('./routes/*.js'))
    if (!file.endsWith("index.js"))
      require(path.resolve(file))(app);

  Page404 = function (req, res, next) { res.status(404).render('page404', { title: "Oops 404!" }); }
  app.re404 = () => { app.remove(Page404); app.use(Page404); }
  app.re404();

  app.use(function (err, req, res, next) {
    console.error(err.message)
    //res.status(500).send(err.message);
    //res.status(500).render('page500', { title: "Oops Error!", error: err.message });
  })
}
