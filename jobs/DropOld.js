const schedule = require('node-schedule')

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
      .then(x => logger.info(`[Jobs] DropOld/${table}: ${x.affectedRows} rows`))
  }
}

// Run at startup
DropOlds()

// Every day at 4:00
schedule.scheduleJob('0 4 * * *', DropOlds)
