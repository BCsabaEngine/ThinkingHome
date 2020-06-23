const RuleCodeTable = db.defineTable('RuleCode', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    JsCode: db.ColTypes.mediumtext(),
  },
});

const RuleCode = {

  async Insert(jscode) {
    await RuleCodeTable.insert({ JsCode: jscode });
  },

  async FindLastJsCode() {
    const rows = await db.pquery("SELECT rc.JsCode FROM RuleCode rc ORDER BY rc.Id DESC LIMIT 1");
    if (rows.length)
      return rows[0].JsCode;
    return null;
  },

};

module.exports = RuleCode;