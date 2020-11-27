const schedule = require('node-schedule')
const userNotify = require('../lib/userNotify')

function DropOlds() {
  const tables = {
    Mqtt: 7,
    OccurenceEvent: 15,
    RuleCodeHistory: 30,
    RuleCodeLog: 30,
    WebAccess: 7
  }

  for (const table of Object.keys(tables)) {
    const days = tables[table]
    db.pquery(`DELETE FROM ${table} WHERE DateTime < NOW() - INTERVAL ${days} DAY`)
      .then(function (deletions) {
        logger.info(`[Jobs] DropOld/${table}: ${deletions.affectedRows} rows`)
        if (deletions.affectedRows) {
          userNotify.addToAdmin(null, 0, 'fa fa-database', `DropOld/${table}`, `${deletions.affectedRows} rows deleted`)
        }
      })
  }
}

// Run at startup
DropOlds()

// Every day at 4:00
schedule.scheduleJob('0 4 * * *', DropOlds)
