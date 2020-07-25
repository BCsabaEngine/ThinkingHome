const schedule = require('node-schedule');

// Every day at 2:00
const j = schedule.scheduleJob('0 2 * * *', function () {

  db.pquery("DELETE FROM DeviceStat WHERE EXISTS (SELECT 1 FROM DeviceStat ds2 WHERE ds2.DateTime = DeviceStat.DateTime AND ds2.Device = DeviceStat.Device AND ds2.Stat = DeviceStat.Stat AND ds2.Data = DeviceStat.Data AND ds2.Id > DeviceStat.Id)")
    .then(x => logger.info(`[Jobs] DropDuplicates.Stat: ${x.affectedRows} rows`));

  db.pquery("DELETE FROM DeviceTele WHERE EXISTS (SELECT 1 FROM DeviceTele dt2 WHERE dt2.DateTime = DeviceTele.DateTime AND dt2.Device = DeviceTele.Device AND dt2.Telemetry = DeviceTele.Telemetry AND dt2.Data = DeviceTele.Data AND dt2.Id > DeviceTele.Id)")
    .then(x => logger.info(`[Jobs] DropDuplicates.Tele: ${x.affectedRows} rows`));

});