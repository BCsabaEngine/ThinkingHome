const Device = requireRoot('/models/Device');
const DeviceCapability = requireRoot('/models/DeviceCapability');
const DeviceSys = requireRoot('/models/DeviceSys');
const DeviceEvent = requireRoot('/models/DeviceEvent');

module.exports = (app) => {

  app.get('/settings', async function (req, res, next) {
    try {
      res.render('settings', {
        title: "Settings",
        runstatus: global.context.GetRunStatus(),
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
        runstatus: global.context.GetRunStatus(),
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

        res.send("OK");
      }
    }
    catch (err) { next(err); }
  })

  app.post('/device/:devicename/:command/:message', function (req, res) {
    const devicename = req.params.devicename;
    const command = req.params.command;
    const message = req.params.message;

    const ctxdevice = global.context.devices[devicename];
    if (!ctxdevice)
      throw new Error(`Device ${devicename} not found in context`);

    ctxdevice.cmd(command, message);

    res.send("OK");
  });

}
