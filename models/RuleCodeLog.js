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

  Insert(message) {
    return RuleCodeLogTable.insert({ Message: message });
  },

  GetLastLogs(limit = 100) {
    return RuleCodeLogTable.select('*', 'ORDER BY Id DESC LIMIT ?', [limit]);
  },

};

module.exports = RuleCodeLog;
