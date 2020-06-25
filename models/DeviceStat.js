const DeviceStatTable = db.defineTable('DeviceStat', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).notNull().index(),
    Stat: db.ColTypes.varchar(100).notNull(),
    Data: db.ColTypes.varchar(512),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
  ],
});

const DeviceStat = {

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

  async Insert(device, stat, data) {
    await DeviceStatTable.insert({ Device: device, Stat: stat, Data: data });
  },

};

module.exports = DeviceStat;