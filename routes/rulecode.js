const jsbeautify = require('js-beautify').js
const RuleCode = require('../models/RuleCode')
const RuleCodeHistory = require('../models/RuleCodeHistory')
const RuleCodeLog = require('../models/RuleCodeLog')
const RuleCodeExecutor = require('../lib/ruleCodeExecutor')

const http411 = 411
const rulecodeminlines = 30
const rulecodepluslines = 30

module.exports = (app) => {
  app.get('/rulecode/list', async function (req, res, next) {
    try {
      const rulecodes = await RuleCode.GetAllSync()
      for (const rulecode of rulecodes) {
        rulecode.linecount = rulecode.JsCode.split(/\r\n|\r|\n/).length
        rulecode.parsed = RuleCodeExecutor.ParseJsCode(rulecode.JsCode)
        rulecode.runerrormessage = global.runningContext.GetRuleCodeExecutorMessage(rulecode.Id)
      }

      res.render('rulecodelist', {
        title: 'Rules',
        rulecodes: rulecodes,
        devices: global.runningContext.GetDevices()
      })
    } catch (err) { next(err) }
  })

  app.get('/rulecode/edit/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      const rulecode = await RuleCode.GetByIdSync(id)
      if (!rulecode) throw new Error('Rulecode not found')

      let rulecodelinecount = rulecode.JsCode.split(/\r\n|\r|\n/).length
      rulecodelinecount += rulecodepluslines
      if (rulecodelinecount < rulecodeminlines) { rulecodelinecount = rulecodeminlines }

      res.render('rulecode', {
        title: `Rule - ${rulecode.displayname}`,
        rulecode: rulecode,
        rulecodelinecount: rulecodelinecount,
        runerrormessage: global.runningContext.GetRuleCodeExecutorMessage(id),
        runerrorstack: global.runningContext.GetRuleCodeExecutorStack(id),
        runconsole: global.runningContext.GetRuleCodeExecutorConsoleLines(id),
        devices: global.runningContext.GetDevices()
      })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/createbyname', async function (req, res, next) {
    try {
      const name = req.body.name
      const id = await RuleCode.CreateByNameSync(name.trim())
      res.send({ id: id })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/createfordevice', async function (req, res, next) {
    try {
      const deviceid = req.body.deviceid
      const id = await RuleCode.CreateForDeviceSync(deviceid)
      res.send({ id: id })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/update/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      const rulecode = req.body.rulecode || ''
      RuleCode.UpdateJsCodeSync(id, rulecode.trim())
        .then(async function () {
          await global.runningContext.StartRuleCodeExecutors()
          res.send('OK')
        })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/enable/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      RuleCode.EnableSync(id)
        .then(async function () {
          await global.runningContext.StartRuleCodeExecutors()
          res.send('OK')
        })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/disable/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      RuleCode.DisableSync(id)
        .then(async function () {
          await global.runningContext.StartRuleCodeExecutors()
          res.send('OK')
        })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/delete/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      RuleCode.DeleteSync(id)
        .then(async function () {
          await global.runningContext.StartRuleCodeExecutors()
          res.send('OK')
        })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/format', async function (req, res, next) {
    try {
      const rulecode = req.body.rulecode
      if (!rulecode) {
        res.status(http411).send('Empty content')
      } else {
        const formatted = jsbeautify(rulecode, { indent_size: 2, wrap_line_length: 80 })
        res.send(formatted)
      }
    } catch (err) { next(err) }
  })

  app.get('/rulecode/loglist', async function (req, res, next) {
    try {
      const limit = 100
      RuleCodeLog.GetLastLogs(null, limit)
        .then(rulecodelogs => {
          res.render('rulecodelog', {
            title: 'Rules log',
            limit: limit,
            rulecode: null,
            rulecodelogs: rulecodelogs
          })
        })
    } catch (err) { next(err) }
  })

  app.get('/rulecode/loglist/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      const rulecode = await RuleCode.GetByIdSync(id)

      const limit = 100
      RuleCodeLog.GetLastLogs(id, limit)
        .then(rulecodelogs => {
          res.render('rulecodelog', {
            title: 'Rules log',
            limit: limit,
            rulecode: rulecode,
            rulecodelogs: rulecodelogs
          })
        })
    } catch (err) { next(err) }
  })
}
