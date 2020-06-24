const Device = requireRoot('/models/Device');
const DeviceCapability = requireRoot('/models/DeviceCapability');
const DeviceSys = requireRoot('/models/DeviceSys');
const DeviceEvent = requireRoot('/models/DeviceEvent');

module.exports = (app) => {

  app.get('/settings', async function (req, res, next) {
    try {
      res.render('settings', {
        title: "Settings",
        runerror: global.context.GetRunErrorMessage(),
      });
    }
    catch (err) { next(err); }
  })

  app.get('/settings/rulecode', async function (req, res, next) {
    try {
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
      const rulecodelogs = await requireRoot('/models/RuleCodeLog').GetLastLogs();
      res.render('rulecodelog', {
        title: "Rule logs",
        rulecodelogs: rulecodelogs,
      });
    }
    catch (err) { next(err); }
  })

}
