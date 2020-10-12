const jsbeautify = require('js-beautify').js
const RuleCode = require('../models/RuleCode')
const RuleCodeLog = require('../models/RuleCodeLog')

const http411 = 411
const rulecodeminlines = 30
const rulecodepluslines = 30

module.exports = (app) => {
  app.get('/rulecode', async function (req, res, next) {
    try {
      const rulecode = await RuleCode.FindLastJsCode()
      let rulecodelinecount = rulecode.split(/\r\n|\r|\n/).length
      rulecodelinecount += rulecodepluslines
      if (rulecodelinecount < rulecodeminlines) { rulecodelinecount = rulecodeminlines }

      res.render('rulecode', {
        title: 'Rules',
        rulecode: rulecode,
        rulecodelinecount: rulecodelinecount,
        runerrormessage: global.runningContext.GetRuleCodeExecutorMessage(),
        runerrorstack: global.runningContext.GetRuleCodeExecutorStack(),
        runconsole: global.runningContext.GetRuleCodeExecutorConsoleLines(),
        devices: global.runningContext.GetDevices()
      })
    } catch (err) { next(err) }
  })

  app.post('/rulecode/update', async function (req, res, next) {
    try {
      const rulecode = req.body.rulecode
      if (!rulecode) { res.status(http411).send('Empty content') } else {
        RuleCode.Insert(rulecode.trim())
          .then(async function () {
            await global.runningContext.StartRuleCodeExecutor()
            res.send('OK')
          })
      }
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
      RuleCodeLog.GetLastLogs(limit)
        .then(rulecodelogs => {
          res.render('rulecodelog', {
            title: 'Rules log',
            limit: limit,
            rulecodelogs: rulecodelogs
          })
        })
    } catch (err) { next(err) }
  })
}
