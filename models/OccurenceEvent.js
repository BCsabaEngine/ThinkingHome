const OccurenceEventTable = db.defineTable('OccurenceEvent', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).notNull(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp()
  },
  keys: [
    db.KeyTypes.index('Name', 'DateTime')
  ]
})

const OccurenceEventModel = {

  async GetFromToday(name) {
    return await OccurenceEventTable.select(['DateTime'], 'WHERE Name = ? AND DateTime >= CURDATE()', [name])
  },

  async InsertSync(name) {
    const res = await OccurenceEventTable.insert({ Name: name })
    return res.insertId
  }

}

module.exports = OccurenceEventModel
