const glob = require('glob');
const path = require('path');
const favicon = require('serve-favicon');
const nGfirewall = require.main.require('./lib/nGfirewall');
const IpBlacklist = require.main.require('./lib/IpBlacklist');

module.exports = (app) => {

  // filter private and public banned IPs
  app.use(IpBlacklist.check({
    blackLists: [
      "blacklist.txt",
      "https://sslbl.abuse.ch/blacklist/sslipblacklist.txt",
      "https://myip.ms/files/blacklist/general/latest_blacklist.txt",
    ],
    whiteListLifeTimeMs: 10 * 60 * 1000,
    onFailRequest: function (ipAddress) {
      require('fs').appendFile('banned.ips', ipAddress + require('os').EOL, 'utf8', () => { });
    }
  }));

  // filter malicious requests
  app.use(nGfirewall.check({
    onFailRequest: function (ipAddress, item, rule) {
      console.log("[nGfirewall] %s from %s matched %s", item, ipAddress, rule);
    }
  }));

  app.use(require('express').static('public', { index: false, maxAge: '1h', redirect: false }));
  app.use(favicon(path.resolve('./public/favicon.ico')));

  // early loading of common and login routes
  require(path.resolve('./routes/common.js'))(app);
  require(path.resolve('./routes/login.js'))(app);

  // all other definition files
  glob.sync('./routes/*.js').forEach(function (file) {
    if (!file.endsWith("index.js"))
      require(path.resolve(file))(app);
  });

  app.use(function (req, res, next) {
    res.status(404).render('page404', { title: "Oops 404!" });
  })

  app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).render('page500', { title: "Oops Error!", error: err.message });
  })
}
