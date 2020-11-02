const RuleCodeLogTable = db.defineTable('RuleCodeLog', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().index().defaultCurrentTimestamp(),
    RuleCode: db.ColTypes.int(10).notNull().index(),
    Message: db.ColTypes.varchar(1024).notNull()
  },
  keys: [
    db.KeyTypes.foreignKey('RuleCode').references('RuleCode', 'Id').cascade()
  ]
})

const RuleCodeLogModel = {

  Insert(rulecode, message) {
    return RuleCodeLogTable.insert({ RuleCode: rulecode, Message: message || '' })
  },

  async GetLastLogs(rulecode = null, limit = 100) {
    if (rulecode) {
      return RuleCodeLogTable.select('*', 'WHERE RuleCode = ? ORDER BY Id DESC LIMIT ?', [rulecode, limit])
    }
    return await db.pquery('SELECT rcl.DateTime, COALESCE(rc.Name, d.Name) AS RuleCodeName, rcl.Message FROM RuleCodeLog rcl LEFT JOIN RuleCode rc ON rc.Id = rcl.RuleCode LEFT JOIN Device d ON d.Id = rc.Device ORDER BY rcl.Id DESC LIMIT ?', [limit])
  }
}

module.exports = RuleCodeLogModel
