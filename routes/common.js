const WebAccess = require('../models/WebAccess')

module.exports = (app) => {
  // log all request
  app.use(function (req, res, next) {
    const user = req.session && req.session.user ? req.session.user.id : null
    const uri = req.originalUrl
    const session = req.sessionID
    const remoteip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

    WebAccess.Insert(user, uri, session, remoteip)

    return next()
  })
}
