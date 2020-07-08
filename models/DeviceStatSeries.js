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

/*
  async GetLastByDeviceId(deviceid) {
    const rows = await db.pquery(`
      SELECT de.Event, de.Data, de.DateTime
      FROM DeviceEvent de
      WHERE de.Device = ? AND
            NOT EXISTS(SELECT 1
                       FROM DeviceEvent de2
                       WHERE de2.Device = de.Device AND
                             de2.Event = de.Event AND
                             de2.Id > de.Id)
      ORDER BY de.Event`, [deviceid]);
    return rows;
  },
*/

};

module.exports = DeviceStatSeries;