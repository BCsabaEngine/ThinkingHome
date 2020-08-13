const DeviceEventTable = db.defineTable('DeviceEvent', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp().index(),
    Device: db.ColTypes.int(11).notNull().index(),
    Event: db.ColTypes.varchar(100).notNull(),
    Data: db.ColTypes.varchar(512),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('Device', 'Event', 'DateTime'),
  ],
});

const DeviceEvent = {

  GetLastByDeviceId(deviceid, days) {
    return db.pquery(`
      SELECT events.Event,
          (SELECT de.Data FROM DeviceEvent de WHERE de.Event = events.Event AND de.Device = ? ORDER BY de.Id DESC LIMIT 1) AS Data,
          (SELECT de.DateTime FROM DeviceEvent de WHERE de.Event = events.Event AND de.Device = ? ORDER BY de.Id DESC LIMIT 1) AS DateTime
      FROM
      (SELECT DISTINCT de.Event
      FROM DeviceEvent de
      WHERE de.Device = ? AND
            de.DateTime > NOW() - INTERVAL ? DAY) events`, [deviceid, deviceid, deviceid, days]);
  },

  GetAllByDeviceId(deviceid, days) {
    return db.pquery("SELECT de.DateTime, de.Event, de.Data FROM DeviceEvent de WHERE de.Device = ? AND de.DateTime > NOW() - INTERVAL ? DAY", [deviceid, days]);
  },

  Insert(device, event, data) {
    return DeviceEventTable.insert({ Device: device, Event: event, Data: data });
  },

};

module.exports = DeviceEvent;