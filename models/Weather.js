const WeatherTable = db.defineTable('Weather', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    Date: db.ColTypes.date().notNull(),
    Hour: db.ColTypes.int(10).notNull(),
    Data: db.ColTypes.longtext()
  },
  keys: [
    db.KeyTypes.index('Date', 'Hour')
  ]
})

const WeatherModel = {

  Insert(data) {
    const date = new Date().toJSON().slice(0, 10)
    const hour = new Date().getHours()

    WeatherTable.select(['Id'], 'WHERE Date = ? AND Hour = ?', [date, hour])
      .then(rows => {
        if (!rows || !rows.length) { WeatherTable.insert({ Date: date, Hour: hour, Data: data }) }
      })
  }

}

module.exports = WeatherModel
