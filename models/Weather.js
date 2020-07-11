const WeatherTable = db.defineTable('Weather', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Date: db.ColTypes.date().notNull(),
    Hour: db.ColTypes.int(11).notNull(),
    Data: db.ColTypes.longtext(),
  },
  keys: [
    db.KeyTypes.index('Date', 'Hour'),
  ],
});

const Weather = {

  async Insert(data) {
    const date = new Date().toJSON().slice(0, 10);
    const hour = new Date().getHours();

    const rows = await WeatherTable.select(['Id'], 'WHERE Date = ? AND Hour = ?', [date, hour]);
    if (!rows.length || rows.length == 0)
      WeatherTable.insert({ Date: date, Hour: hour, Data: data });
  },

};

module.exports = Weather;