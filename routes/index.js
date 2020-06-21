const glob = require('glob');
const path = require('path');
const favicon = require('serve-favicon');

module.exports = (app) => {
  // static folders for template
  app.use(require('express').static('public', { index: false, maxAge: '1h', redirect: false }));

  // serve favicon
  app.use(favicon(path.resolve('./public/favicon.ico')));

  // early loading of login routes
  require(path.resolve('./routes/login.js'))(app);

  // all other definition files
  glob.sync('./routes/*.js').forEach(function (file) {
    if (!file.endsWith("index.js"))
      require(path.resolve(file))(app);
  });

  app.use(function (req, res, next) {
    res.status(404).render('404', { title: "Oops 404!" });
  })  
}
