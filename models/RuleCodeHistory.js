const RuleCodeHistoryTable = db.defineTable('RuleCodeHistory', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).index(),
    Device: db.ColTypes.int(10).index(),
    DateTime: db.ColTypes.datetime().notNull().index().defaultCurrentTimestamp(),
    JsCode: db.ColTypes.mediumtext().notNull()
  }
})

const RuleCodeHistoryModel = {

  async GetByNameSync(name) {
    return await RuleCodeHistoryTable.select(['DateTime', 'JsCode'], 'WHERE Name = ?', [name])
  },

  async GetForDeviceSync(deviceid) {
    return await RuleCodeHistoryTable.select(['DateTime', 'JsCode'], 'WHERE Device = ?', [deviceid])
  }

}

module.exports = RuleCodeHistoryModel
