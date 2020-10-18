const RuleCodeLogTable = db.defineTable('RuleCodeLog', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Topic: db.ColTypes.varchar(100).notNull(),
    Message: db.ColTypes.varchar(1024).notNull()
  },
  keys: [
    db.KeyTypes.index('DateTime')
  ]
})

const RuleCodeLog = {

  Insert(topic, message) {
    return RuleCodeLogTable.insert({ Topic: topic || '', Message: message || '' })
  },

  GetLastLogs(limit = 100) {
    return RuleCodeLogTable.select('*', 'ORDER BY Id DESC LIMIT ?', [limit])
  }

}

module.exports = RuleCodeLog
