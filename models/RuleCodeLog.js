const RuleCodeLogTable = db.defineTable('RuleCodeLog', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Message: db.ColTypes.varchar(512).notNull(),
  },
  keys: [
    db.KeyTypes.index('DateTime'),
  ],
});

const RuleCodeLog = {

  async Insert(message) {
    await RuleCodeLogTable.insert({ Message: message });
  },

  async GetLastLogs(limit = 100) {
    const rows = await RuleCodeLogTable.select('*', 'ORDER BY Id DESC LIMIT ?', [limit]);
    return rows;
  },

};

module.exports = RuleCodeLog;
