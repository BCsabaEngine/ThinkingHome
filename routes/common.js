const ipUtils = require('../lib/ipUtils')
const WebAccessModel = require('../models/WebAccess')
const UserNotifyModel = require('../models/UserNotify')

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

  app.use(async function (req, res, next) {
    const user = app.getUser(req)
    app.locals.usernotifies = user && user.id ? await await UserNotifyModel.GetUnreadByUserIdSync(user.id) : []

    return next()
  })
}
