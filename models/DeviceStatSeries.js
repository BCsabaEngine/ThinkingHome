const DeviceStatSeriesTable = db.defineTable('DeviceStatSeries', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Device: db.ColTypes.int(11).notNull().index(),
    Stat: db.ColTypes.varchar(100).notNull(),
    DateTimeStart: db.ColTypes.datetime().notNull().defaultCurrentTimestamp().index(),
    DateTimeEnd: db.ColTypes.datetime(),
    Data: db.ColTypes.varchar(512),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('Device', 'Stat', 'DateTimeEnd'),
  ],
});

const DeviceStatSeries = {

  async GetByDeviceId(deviceid, stat, days = 1) {
    const rows = await db.pquery(`
      SELECT
        dss.Data,
        dss.DateTimeStart,
        COALESCE(dss.DateTimeEnd, NOW()) AS DateTimeEnd,
        TIMESTAMPDIFF(MINUTE, dss.DateTimeStart, COALESCE(dss.DateTimeEnd, NOW())) AS Minute
      FROM DeviceStatSeries dss
      WHERE dss.Device = ? AND
            dss.Stat = ? AND
            dss.DateTimeStart >= NOW() - INTERVAL ? DAY
      ORDER BY dss.DateTimeStart, dss.Id`, [deviceid, stat, days]);
    return rows;
  },

};

module.exports = DeviceStatSeries;