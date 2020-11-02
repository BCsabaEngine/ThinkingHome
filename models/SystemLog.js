const SystemLogTable = db.defineTable('SystemLog', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().index().defaultCurrentTimestamp(),
    Topic: db.ColTypes.varchar(100).notNull().index(),
    Level: db.ColTypes.int(10).notNull().index(),
    Message: db.ColTypes.varchar(1024).notNull()
  }
})

const SystemLogModel = {
  // Level: 0:info, 1:warn, 2:error
  Insert(topic, message) { return this.InsertInternal(topic, message, 0) },
  InsertWarn(topic, message) { return this.InsertInternal(topic, message, 1) },
  InsertError(topic, message) { return this.InsertInternal(topic, message, 2) },

  InsertInternal(topic, message, level) {
    switch (level) {
      case 1:
        logger.warn(`[${topic}] ${message}`)
        break
      case 2:
        logger.error(`[${topic}] ${message}`)
        break
      default:
        logger.info(`[${topic}] ${message}`)
        break
    }
    return SystemLogTable.insert({ Topic: topic, Message: message, Level: level })
  },

  async GetTopicLogs(topic, limit = 1) { return SystemLogTable.select('*', 'WHERE topic = ? ORDER BY Id DESC LIMIT ?', [topic, limit]) },

  async GetLastTopicLog(topic) {
    const result = await this.GetTopicLogs(topic, 1)
    if (result && result.length) return result[0]
    return null
  }
}

module.exports = SystemLogModel
