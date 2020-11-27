const os = require('os')
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const compression = require('compression')
const pug = require('pug')
const helmet = require('helmet')
const hpp = require('hpp')
const routeInitializer = require('../routes')

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

  if (config.web.port) {
    const httpserver = http.createServer(app)
    httpserver.listen(config.web.port, () => {
      logger.info('[HTTP] Webserver listening at http://%s:%s', httpserver.address().address, httpserver.address().port)
    })
    global.httpserver = httpserver
  }

  if (config.web.ssl && config.web.ssl.port) {
    const privateKey = fs.readFileSync(config.web.ssl.key, 'utf8')
    const certificate = fs.readFileSync(config.web.ssl.cert, 'utf8')
    const ca = fs.readFileSync(config.web.ssl.ca, 'utf8')

    const credentials = { key: privateKey, cert: certificate, ca: ca }

    const httpsserver = https.createServer(credentials, app)
    httpsserver.listen(config.web.ssl.port, () => {
      logger.info('[HTTPS] Webserver listening at https://%s:%s', httpsserver.address().address, httpsserver.address().port)
    })
    global.httpsserver = httpsserver
  }

  return app
}
