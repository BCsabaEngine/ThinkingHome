const os = require('os');
const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const compression = require('compression');
const pug = require('pug');
const helmet = require('helmet')
const dayjs = require('dayjs');
const routeInitializer = require.main.require('./routes');

module.exports = () => {
  // Create Express app and init routes
  const app = express();

  // default settings
  app.set('strict routing', false);
  app.set('trust proxy', true);

  // sessions
  app.use(session({
    secret: os.hostname(),
    resave: true,
    saveUninitialized: true,
  }));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(compression());

  // template engine
  app.engine('pug', pug.__express);
  app.set('view engine', 'pug');
  app.set('views', path.resolve('./views'));
  app.locals.pretty = true; // readable generated HTML code

  const pugcache = (process.env.NODE_ENV === 'production');
  const origrenderfile = pug.renderFile;
  let pugnextuniquevalue = 0;
  pug.renderFile = (path, options, fn) => {
    options.cache = pugcache;
    options.dayjs = dayjs;
    options.truncate = function (str, length) { return ((str || "").length <= length) ? str : str.substring(0, length) + '...'; }
    options.genUnique = function () { return pugnextuniquevalue++; }
    return origrenderfile(path, options, fn);
  };

  // Helmet, but disable contentSecurityPolicy
  // app.use(helmet());
  // app.use(helmet.contentSecurityPolicy());
  app.use(helmet.dnsPrefetchControl());
  app.use(helmet.expectCt());
  app.use(helmet.frameguard());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.hsts());
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());
  app.use(helmet.permittedCrossDomainPolicies());
  app.use(helmet.referrerPolicy());
  app.use(helmet.xssFilter());

  app.remove = (handler, router) => {
    router = router || app._router;
    for (let i = 0; i < router.stack.length; i++)
      if (router.stack[i].handle == handler) {
        router.stack.splice(i, 1);
        break;
      }
  };

  routeInitializer(app);

  // Start HTTP server
  const httpserver = app.listen(config.web.port, () => {
    logger.info("[HTTP] Webserver listening at http://%s:%s", httpserver.address().address, httpserver.address().port)
  })

  global.httpserver = httpserver;

  return app;
}
