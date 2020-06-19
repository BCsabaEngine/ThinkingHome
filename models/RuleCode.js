const RuleCodeTable = db.defineTable('RuleCode', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    JsCode: db.ColTypes.mediumtext(),
  },
});

const RuleCode = {
};

module.exports = RuleCode;