const schedule = require('node-schedule');

// Every day at 4:00
const j = schedule.scheduleJob('0 4 * * *', function () {

  db.pquery("DELETE FROM DeviceLog WHERE DateTime < NOW() - INTERVAL 90 DAY")
    .then(x => logger.info(`[Jobs] DropOld/DeviceLog: ${x.affectedRows} rows`));

  db.pquery("DELETE FROM DeviceSys WHERE DateTime < NOW() - INTERVAL 30 DAY")
    .then(x => logger.info(`[Jobs] DropOld/DeviceSys: ${x.affectedRows} rows`));

  db.pquery("DELETE FROM Mqtt WHERE DateTime < NOW() - INTERVAL 30 DAY")
    .then(x => logger.info(`[Jobs] DropOld/Mqtt: ${x.affectedRows} rows`));

  db.pquery("DELETE FROM Mqtt WHERE UnknownDevice IS NOT NULL AND DateTime < NOW() - INTERVAL 2 DAY")
    .then(x => logger.info(`[Jobs] DropOld/Mqtt unknown device: ${x.affectedRows} rows`));

  db.pquery("DELETE FROM RuleCode WHERE EXISTS(SELECT 1 FROM RuleCode rc2 WHERE rc2.Id > RuleCode.Id) AND RuleCode.DateTime < NOW() - INTERVAL 90 DAY")
    .then(x => logger.info(`[Jobs] DropOld/RuleCode: ${x.affectedRows} rows`));

  db.pquery("DELETE FROM RuleCodeLog WHERE DateTime < NOW() - INTERVAL 90 DAY")
    .then(x => logger.info(`[Jobs] DropOld/RuleCodeLog: ${x.affectedRows} rows`));

});