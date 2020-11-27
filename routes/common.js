const ipUtils = require('../lib/ipUtils')
const WebAccessModel = require('../models/WebAccess')
const dayjs = require('dayjs')
const UserNotifyModel = require('../models/UserNotify')
const stringUtils = require('../lib/stringUtils')

module.exports = (app) => {
  // log all request
  app.use(function (req, res, next) {
    const user = req.session && req.session.user ? req.session.user.id : null
    const uri = req.originalUrl
    const session = req.sessionID
    const requestip = ipUtils.remoteip(req)

    WebAccessModel.Insert(user, uri, session, requestip)

    return next()
  })

  // variables available in all request
  app.use(async function (req, res, next) {
    app.locals.truncate = stringUtils.truncate
    app.locals.middlemask = stringUtils.middlemask
    app.locals.dayjs = dayjs

    const user = app.getUser(req)
    app.locals.user = user || {}
    app.locals.usernotifies = user && user.id ? await await UserNotifyModel.GetUnreadByUserIdSync(user.id) : []

    return next()
  })
}
