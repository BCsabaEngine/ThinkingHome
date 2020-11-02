const ipUtils = require('../lib/ipUtils')
const WebAccessModel = require('../models/WebAccess')

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
}
