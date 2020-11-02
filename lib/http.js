const os = require('os')
const path = require('path')
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const compression = require('compression')
const pug = require('pug')
const helmet = require('helmet')
const hpp = require('hpp')
const dayjs = require('dayjs')
const routeInitializer = require('../routes')
const stringUtils = require('./stringUtils')

module.exports = () => {
  const app = express()

  app.set('strict routing', false)
  app.set('trust proxy', true)

  app.use(session({
    secret: os.hostname(),
    resave: true,
    saveUninitialized: true
  }))

  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(cookieParser(os.hostname(), { httpOnly: true }))
  app.use(hpp())
  app.use(express.json())
  app.use(compression())

  app.engine('pug', pug.__express)
  app.set('view engine', 'pug')
  app.set('views', path.resolve('./views'))
  app.locals.pretty = true // readable generated HTML code

  const origrenderfile = pug.renderFile
  let pugnextuniquevalue = 0
  pug.renderFile = (path, options, fn) => {
    options.cache = global.IsProduction
    options.dayjs = dayjs
    options.truncate = stringUtils.truncate
    options.middlemask = stringUtils.middlemask
    options.genUnique = function () { return pugnextuniquevalue++ }
    options.isproduction = global.IsProduction
    return origrenderfile(path, options, fn)
  }

  app.use(helmet({ contentSecurityPolicy: false }))

  app.remove = (handler, router) => {
    const r = router || app._router
    for (let i = 0; i < r.stack.length; i++) {
      if (r.stack[i].handle === handler) {
        r.stack.splice(i, 1)
        break
      }
    }
  }

  routeInitializer(app)

  const httpserver = app.listen(config.web.port, () => {
    logger.info('[HTTP] Webserver listening at http://%s:%s', httpserver.address().address, httpserver.address().port)
  })

  global.httpserver = httpserver

  return app
}
