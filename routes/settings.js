const UserPermission = require("../models/UserPermission");

const User = requireRoot('/models/User');

module.exports = (app) => {

  app.get('/settings', async function (req, res, next) {
    try {
      await req.RequirePermission(UserPermissions.RuleCode);

      res.render('settings', {
        title: "Settings",
        usercount: await User.Count(),
        runerror: global.context.GetRunErrorMessage(),
      });
    }
    catch (err) { next(err); }
  })

  app.get('/settings/rulecode', async function (req, res, next) {
    try {
      await req.RequirePermission(UserPermissions.RuleCode);

      const rulecode = await requireRoot('/models/RuleCode').FindLastJsCode();
      res.render('rulecode', {
        title: "Rule editor",
        rulecode: rulecode,
        runerrorstack: global.context.GetRunErrorStack(),
        devicenames: global.context.GetDeviceList(),
      });
    }
    catch (err) { next(err); }
  })

  app.post('/settings/rulecode/update', async function (req, res, next) {
    try {
      await req.RequirePermission(UserPermissions.RuleCode);

      const rulecode = req.body.rulecode;
      if (!rulecode)
        res.status(411).send("Empty content");
      else {
        await requireRoot('/models/RuleCode').Insert(rulecode.trim());

        global.context.RunContext();

        res.send("OK");
      }
    }
    catch (err) { next(err); }
  })

  app.get('/settings/rulecode/log', async function (req, res, next) {
    try {
      await req.RequirePermission(UserPermissions.RuleCode);

      const rulecodelogs = await requireRoot('/models/RuleCodeLog').GetLastLogs();
      res.render('rulecodelog', {
        title: "Rule logs",
        rulecodelogs: rulecodelogs,
      });
    }
    catch (err) { next(err); }
  })

  app.post('/settings/restart', async function (req, res, next) {
    try {
      await req.RequirePermission(UserPermissions.Restart);

      res.send("OK");

      setTimeout(() => {
        process.exit();
      }, 500);
    }
    catch (err) { next(err); }
  })

}
