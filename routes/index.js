const glob = require('glob');
const path = require('path');
const pug = require('pug');
const favicon = require('serve-favicon');
const helmet = require('helmet')

module.exports = (app) => {

  // default settings
  app.set('strict routing', true);
  app.set('trust proxy', true);

  // template engine
  app.engine('pug', pug.__express)
  app.set('view engine', 'pug');
  app.set('views', path.resolve('./views'));
  app.locals.pretty = true; // readable generated HTML code

  // minimal security
  app.use(helmet());

  // static folders for template
  app.use(require('express').static('public', { index: false, maxAge: '1h', redirect: false }));

  // serve favicon
  app.use(favicon(path.resolve('./public/favicon.ico')));

  // all other definition files
  glob.sync('./routes/*.js').forEach(function (file) {
    if (!file.endsWith("index.js"))
      require(path.resolve(file))(app);
  });
}
