/* const BoardHistoryTable = */ db.defineTable('BoardHistory', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Board: db.ColTypes.int(10).notNull().index(),
    Yaml: db.ColTypes.mediumtext()
  }
})

const BoardHistoryModel = {

}

module.exports = BoardHistoryModel
