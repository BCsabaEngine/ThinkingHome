const SystemLogTable = db.defineTable('SystemLog', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().index().defaultCurrentTimestamp(),
    Topic: db.ColTypes.varchar(100).notNull().index(),
    Level: db.ColTypes.int(10).notNull().index(), // 0:info, 1:warn, 2:error
    Message: db.ColTypes.varchar(1024).notNull()
  }
})

const SystemLogModel = {

  Insert(topic, message) { return SystemLogTable.insert({ Topic: topic, Message: message, Level: 0 }) },
  InsertWarn(topic, message) { return SystemLogTable.insert({ Topic: topic, Message: message, Level: 1 }) },
  InsertError(topic, message) { return SystemLogTable.insert({ Topic: topic, Message: message, Level: 2 }) },

  async GetLastTopicLogs(topic, limit = 1) { return SystemLogTable.select('*', 'WHERE topic = ? ORDER BY Id DESC LIMIT ?', [topic, limit]) }
}

module.exports = SystemLogModel
