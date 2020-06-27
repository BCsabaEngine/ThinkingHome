const schedule = require('node-schedule');

// Every day at 4:00
const j = schedule.scheduleJob('0 4 * * *', function () {

  logger.debug("[Jobs] DropOld/DeviceLog");
  db.query("DELETE FROM DeviceLog WHERE DateTime < NOW() - INTERVAL 90 DAY");

  logger.debug("[Jobs] DropOld/DeviceSys");
  db.query("DELETE FROM DeviceSys WHERE DateTime < NOW() - INTERVAL 90 DAY");

  logger.debug("[Jobs] DropOld/Mqtt");
  db.query("DELETE FROM Mqtt WHERE DateTime < NOW() - INTERVAL 90 DAY");

  logger.debug("[Jobs] DropOld/RuleCode");
  db.query("DELETE FROM RuleCode WHERE EXISTS(SELECT 1 FROM RuleCode rc2 WHERE rc2.Id > RuleCode.Id) AND RuleCode.DateTime < NOW() - INTERVAL 90 DAY");

  logger.debug("[Jobs] DropOld/RuleCodeLog");
  db.query("DELETE FROM RuleCodeLog WHERE DateTime < NOW() - INTERVAL 90 DAY");

});