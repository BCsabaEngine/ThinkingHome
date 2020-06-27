const logger = requireRoot("/lib/logger");
const schedule = require('node-schedule');

// Every day at 2:00
const j = schedule.scheduleJob('0 2 * * *', function () {
  logger.debug("[Jobs] DropDuplicates.Tele");

  db.query("DELETE FROM DeviceTele WHERE EXISTS (SELECT 1 FROM DeviceTele dt2 WHERE dt2.DateTime = DeviceTele.DateTime AND dt2.Device = DeviceTele.Device AND dt2.Telemetry = DeviceTele.Telemetry AND dt2.Data = DeviceTele.Data AND dt2.Id > DeviceTele.Id)");
});