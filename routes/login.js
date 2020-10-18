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

  // detect session in all request
  app.all('/*', async function (req, res, next) {
    if (req.session.user) return next()

    if (!global.IsProduction) return next()

    if (!(await UserModel.AnySync())) {
      if (isInSubnet(req.connection.remoteAddress, cidrs)) return next()
    }

    // bypass login request
    if (req.method === 'POST' && req.path === '/login') return next()

    // must login
    if (req.method === 'GET') {
      if (req.path !== '/') { return res.redirect('/') } else { return res.render('login', { title: 'Login' }) }
    }

    return res.status(http403).end()
  })

  app.post('/login', function (req, res) {
    UserModel.FindByEmailPassword(req.body.email, req.body.password)
      .then(user => {
        if (user) {
          req.session.user = { id: user.Id, isadmin: user.IsAdmin, email: user.Email, name: user.Name }
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

    res.redirect('/')
  })
}
