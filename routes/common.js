const WebAccessModel = require('../models/WebAccess')

module.exports = (app) => {
  // log all request
  app.use(function (req, res, next) {
    const user = req.session && req.session.user ? req.session.user.id : null
    const uri = req.originalUrl
    const session = req.sessionID
    let remoteip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    if (remoteip.startsWith('::ffff:')) remoteip = remoteip.substr('::ffff:'.length)

    WebAccessModel.Insert(user, uri, session, remoteip)

    return next()
  })
}
