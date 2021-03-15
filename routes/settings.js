const YAML = require('yaml')
const got = require('got')
const FormData = require('form-data')
const passwordStrength = require('pwd-strength')

const OpenWeatherMap = require('../lib/openWeatherMap')
const BoardBuilder = require('../lib/boardBuilder')
const BackupBuilder = require('../lib/backupBuilder')
const UserModel = require('../models/User')
const BoardModel = require('../models/Board')
const SystemLogModel = require('../models/SystemLog')

const http403 = 403
const http411 = 411
const http500 = 500
const namemaxlength = 100
const emailmaxlength = 100
const yamlminlines = 30
const yamlpluslines = 5
const restartdelay = 500
const topicbootup = 'Bootup'
const topicrestart = 'Restart'
const topicmanualbackup = 'Manual backup'
const topicautobackup = 'Automatic backup'
const topicdyndns = 'DynDns'

module.exports = (app) => {
  app.get('/settings', async function (req, res, next) {
    try {
      // await req.RequirePermission(UserPermissions.RuleCode);

      const boards = await BoardModel.GetAllSync()
      const users = await UserModel.GetAllSync()
      const lastdns = await SystemLogModel.GetLastTopicLog(topicdyndns)
      const lastboot = await SystemLogModel.GetLastTopicLog(topicbootup)
      const lastrestart = await SystemLogModel.GetLastTopicLog(topicrestart)
      const lastmanualbackup = await SystemLogModel.GetLastTopicLog(topicmanualbackup)
      const lastautobackup = await SystemLogModel.GetLastTopicLog(topicautobackup)

      res.render('settings', {
        title: 'System settings',
        systemsettings,
        boards,
        users,
        lastdns,
        lastautobackup,
        lastmanualbackup,
        lastboot,
        lastrestart,
        ipblacklist: app.ipblacklist,
        ipbanlist: app.ipbanlist
      })
    } catch (err) { next(err) }
  })

  app.post('/settings/update/inline', async function (req, res, next) {
    try {
      const name = req.body.name
      const value = req.body.value

      switch (name) {
        case 'OpenweathermapApiKey':
          try {
            await OpenWeatherMap.check(systemsettings.Latitude, systemsettings.Longitude, value)
          } catch (err) { throw new Error('Invalid OpenWeatherMap API key') }
          break
        case 'CloudToken':
          if (value) {
            try {
              const form = new FormData()
              form.append('token', value)

              await got.post(config.brainserver.server + config.brainserver.checkservice, { body: form })
            } catch (err) { throw new Error(`Invalid Token: ${err.message}`) }
          }
          break
        default:
          throw new Error(`Invalid data to store: ${name}`)
      }

      systemsettings.SetByName(name, value)

      res.send('OK')
    } catch (err) { res.status(http500).send(err.message) }
  })

  app.post('/settings/checkopenweatherapikey', async function (req, res, next) {
    try {
      const latitude = req.body.latitude
      const longitude = req.body.longitude
      const apikey = req.body.apikey

      const checkres = await OpenWeatherMap.check(latitude, longitude, apikey)
      res.send(checkres)
    } catch (err) { res.status(http403).send(err.message) }
  })

  app.post('/settings/user/add', async function (req, res, next) {
    try {
      const email = req.body.email
      const password = req.body.password
      const validemail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      const pwdtest = passwordStrength(password, { minPasswordLength: 8, minUpperChars: 1, minLowerChars: 1, minSpecialChars: 0 })

      if (email.length > emailmaxlength) { return res.status(http403).send(`Too long email: max ${emailmaxlength} characters`) }
      if (!validemail) { return res.status(http403).send(`Not a valid email: ${email}`) }
      if (await UserModel.ExistsSync(email)) { return res.status(http403).send(`Email already exists: ${email}`) }
      if (!pwdtest.success) { return res.status(http403).send('Not enought strong password: minimum 8 characters, lower and uppercase letters') }

      const insertres = await UserModel.Insert(email, password)

      // autologin first user
      if (insertres.isadmin) { req.session.user = { id: insertres.insertid, isadmin: true, email: email, name: insertres.name } }

      return res.send('OK')
    } catch (err) { next(err) }
  })

  app.post('/settings/user/update', async function (req, res, next) {
    try {
      const name = req.body.name
      const email = req.body.email

      if (name.length > namemaxlength) { return res.status(http403).send(`Too long name: max ${namemaxlength} characters`) }

      await UserModel.UpdateSync(name, email)

      return res.send('OK')
    } catch (err) { next(err) }
  })

  app.post('/settings/user/delete', async function (req, res, next) {
    try {
      const email = req.body.email

      await UserModel.DeleteSync(email)

      return res.send('OK')
    } catch (err) { next(err) }
  })

  app.post('/settings/board/add', async function (req, res, next) {
    try {
      const name = req.body.name

      if (name.length > namemaxlength) { return res.status(http403).send(`Too long name: max ${namemaxlength} characters`) }

      await BoardModel.InsertSync(name, '')
      res.send('OK')
    } catch (err) { next(err) }
  })

  app.post('/settings/board/setprimary', async function (req, res, next) {
    try {
      const id = req.body.id
      await BoardModel.SetPrimarySync(id)
      res.send('OK')
    } catch (err) { next(err) }
  })

  app.post('/settings/board/updatename', async function (req, res, next) {
    try {
      const id = req.body.id
      const name = req.body.name

      if (name.length > namemaxlength) { return res.status(http403).send(`Too long name: max ${namemaxlength} characters`) }

      await BoardModel.UpdateNameSync(id, name)
      res.send('OK')
    } catch (err) { next(err) }
  })

  app.get('/settings/board/edit/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      const board = await BoardModel.GetByIdSync(id)

      if (!board) { return app.Page404(req, res, next) }

      let yamllinecount = (board.Yaml || '').split(/\r\n|\r|\n/).length
      yamllinecount += yamlpluslines
      if (yamllinecount < yamlminlines) { yamllinecount = yamlminlines }

      res.render('boardeditor', {
        title: 'Board editor',
        board: board,
        yamllinecount: yamllinecount,
        devices: global.runningContext.GetDevices()
      })
    } catch (err) { next(err) }
  })

  app.post('/settings/board/updateyaml', async function (req, res, next) {
    try {
      const id = req.body.id
      const yaml = req.body.yaml

      if (!yaml) { return res.status(http411).send('Empty content') }

      try { YAML.parse(yaml) } catch (err) { return res.status(http403).send(err.message) }

      await BoardModel.UpdateYamlSync(id, yaml)
      res.send('OK')
    } catch (err) { next(err) }
  })

  app.post('/settings/board/formatyaml', function (req, res, next) {
    try {
      const yaml = req.body.yaml

      if (!yaml) { return res.status(http411).send('Empty content') }

      try {
        const parsed = YAML.parse(yaml)
        const formatted = YAML.stringify(parsed)
        return res.send(formatted)
      } catch (err) {
        logger.info(err)
        return res.status(http500).send(err.message)
      }
    } catch (err) { next(err) }
  })

  app.post('/settings/board/checkyaml', function (req, res, next) {
    try {
      const yaml = req.body.yaml

      if (!yaml) { return res.status(http411).send('Empty content') }

      try {
        const bbuilder = new BoardBuilder(yaml)
        return res.send(bbuilder.Build())
      } catch (err) {
        logger.error(err)
        return res.status(http500).send(err.message)
      }
    } catch (err) { next(err) }
  })

  app.post('/settings/board/delete', async function (req, res, next) {
    try {
      const id = req.body.id

      await BoardModel.DeleteSync(id)

      res.send('OK')
    } catch (err) { next(err) }
  })

  app.post('/settings/restart/thinkinghome', async function (req, res, next) {
    try {
      SystemLogModel.Insert(topicrestart, 'Restart from browser')

      setTimeout(() => {
        process.exit()
      }, restartdelay)

      res.send('OK')
    } catch (err) { next(err) }
  })

  app.get('/settings/backup/download', async function (req, res, next) {
    try {
      const bck = new BackupBuilder()
      await bck.CreateBackup(true)

      res.setHeader('Content-Disposition', 'attachment; filename=' + bck.filename)
      res.setHeader('Content-Transfer-Encoding', 'binary')
      res.setHeader('Content-Type', 'application/octet-stream')
      res.sendFile(bck.fullpath, { root: './' }, function (err) {
        if (err) { return next(err) }
        return null
      })
      SystemLogModel.Insert(topicmanualbackup, 'Manual backup created successfully')
    } catch (err) { next(err) }
  })
}
