const os = require('os')
const { isInSubnet } = require('subnet-check')
const UserModel = require('../models/User')

const http403 = 403
const logindelayms = 750

module.exports = (app) => {
  const cidrs = []

  const nets = os.networkInterfaces()
  for (const netname of Object.keys(nets)) {
    for (const net of nets[netname]) {
      if (net.family === 'IPv4' && !net.internal && net.cidr) cidrs.push(net.cidr)
    }
  }
  logger.debug(`[HTTP] Local cidrs: ${cidrs.join(', ')}`)

  app.isLocalIp = function (req) { return isInSubnet(req.connection.remoteAddress, cidrs) }

  app.getUser = function (req) { if (req.session && req.session.user) return req.session.user }

  // detect session in all request
  app.all('/*', async function (req, res, next) {
    if (req.session.user) return next()

    if (req.signedCookies.autologin) {
      try {
        const autologincredentials = JSON.parse(req.signedCookies.autologin)

        await UserModel.FindByIdPasswordHash(autologincredentials.id, autologincredentials.passwordhash)
          .then(user => {
            if (user) {
              req.session.user = { id: user.Id, isadmin: user.IsAdmin, email: user.Email, name: user.Name }

              // Reinit cookie for 24h again
              res.cookie('autologin', req.signedCookies.autologin, { maxAge: 24 * 60 * 60 * 1000, signed: true }) // 24h = 1day
            }
          })
      } catch (error) { return }

      if (req.session.user) return next()
    }

    if (!(await UserModel.AnySync())) {
      if (app.isLocalIp(req)) return next()
    }

    // bypass login request
    if (req.method === 'POST' && req.path === '/login') return next()

    // must login
    if (req.method === 'GET') {
      if (req.path !== '/') {
        if (!app.isLocalIp(req) && app.IpBan) app.IpBan.add404(req)
        return res.redirect('/')
      } else return res.render('login', { title: 'Login' })
    }

    return res.status(http403).end()
  })

  app.post('/login', function (req, res) {
    const email = req.body.email
    const password = req.body.password
    const rememberme = req.body.rememberme

    UserModel.FindByEmailPassword(email, password)
      .then(user => {
        if (user) {
          req.session.user = { id: user.Id, isadmin: user.IsAdmin, email: user.Email, name: user.Name }
          if (rememberme === 'yes') res.cookie('autologin', JSON.stringify({ id: user.Id, passwordhash: UserModel.hashPassword(password, email) }), { maxAge: 24 * 60 * 60 * 1000, signed: true }) // 24h = 1day
          res.send('OK')
        } else {
          setTimeout(() => {
            res.status(http403).end()
          }, logindelayms)
        }
      })
  })

  app.get('/logout', function (req, res) {
    delete req.session.user

    res.cookie('autologin', '', { maxAge: 0 })
    res.redirect('/')
  })
}
