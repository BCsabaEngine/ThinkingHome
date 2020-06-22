const DeviceEventTable = db.defineTable('DeviceEvent', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).index(),
    Event: db.ColTypes.varchar(100),
    Data: db.ColTypes.varchar(512),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
  ],
});

const DeviceEvent = {
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
};

module.exports = DeviceEvent;