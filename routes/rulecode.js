const dayjs = require('dayjs')

const jsbeautify = require('js-beautify').js
const RuleCodeModel = require('../models/RuleCode')
const RuleCodeHistoryModel = require('../models/RuleCodeHistory')
const RuleCodeLogModel = require('../models/RuleCodeLog')
const RuleCodeExecutor = require('../lib/ruleCodeExecutor')
const ObjectUtils = require('../lib/objectUtils')
const ArrayUtils = require('../lib/arrayUtils')

const http411 = 411
const rulecodeminlines = 30
const rulecodepluslines = 30

module.exports = (app) => {
  app.get('/rulecode/list', async function (req, res, next) {
    try {
      const rulecodes = await RuleCodeModel.GetAllSync()
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
      const rulecode = await RuleCodeModel.GetByIdSync(id)
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
        devices: global.runningContext.GetDevices(),
        getFunctionArgs: ObjectUtils.getFunctionArgs
      })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/createbyname', async function (req, res, next) {
    try {
      const name = req.body.name
      const id = await RuleCodeModel.CreateByNameSync(name.trim())
      res.send({ id: id })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/createfordevice', async function (req, res, next) {
    try {
      const deviceid = req.body.deviceid
      const id = await RuleCodeModel.CreateForDeviceSync(deviceid)
      res.send({ id: id })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/update/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      const rulecode = req.body.rulecode || ''
      RuleCodeModel.UpdateJsCodeSync(id, rulecode.trim())
        .then(async function () {
          await global.runningContext.StartRuleCodeExecutors()
          res.send('OK')
        })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/enable/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      RuleCodeModel.EnableSync(id)
        .then(async function () {
          await global.runningContext.StartRuleCodeExecutors()
          res.send('OK')
        })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/disable/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      RuleCodeModel.DisableSync(id)
        .then(async function () {
          await global.runningContext.StartRuleCodeExecutors()
          res.send('OK')
        })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/delete/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      RuleCodeModel.DeleteSync(id)
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
      RuleCodeLogModel.GetLastLogs(null, limit)
        .then(rulecodelogs => {
          const rulecodeloggroups = ArrayUtils.groupByFn(
            rulecodelogs,
            (i) => dayjs(i.DateTime).format('YYYY-MM-DD'),
            {
              groupsortfn: (i) => i,
              groupsortreverse: true,
              itemsortproperty: '-DateTime'
            })

          res.render('rulecodelog', {
            title: 'Rules log',
            limit,
            rulecodeloggroups,
            rulecode: null
          })
        })
    } catch (err) { next(err) }
  })

  app.get('/rulecode/loglist/:id', async function (req, res, next) {
    try {
      const id = req.params.id
      const rulecode = await RuleCodeModel.GetByIdSync(id)

      const limit = 100
      RuleCodeLogModel.GetLastLogs(id, limit)
        .then(rulecodelogs => {
          const rulecodeloggroups = ArrayUtils.groupByFn(
            rulecodelogs,
            (i) => dayjs(i.DateTime).format('YYYY-MM-DD'),
            {
              groupsortfn: (i) => i,
              groupsortreverse: true,
              itemsortproperty: '-DateTime'
            })

          res.render('rulecodelog', {
            title: 'Rules log',
            limit,
            rulecodeloggroups,
            rulecode
          })
        })
    } catch (err) { next(err) }
  })
}
