const BoardHistoryTable = db.defineTable('BoardHistory', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Board: db.ColTypes.int(11).notNull().index(),
    Yaml: db.ColTypes.mediumtext(),
  },
});

const BoardHistoryModel = {

};

module.exports = BoardHistoryModel;
