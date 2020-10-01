const DeviceTelemetryTable = db.defineTable('DeviceTelemetry', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).notNull().index(),
    Entity: db.ColTypes.varchar(32).notNull(),
    Data: db.ColTypes.float(),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('DateTime'),
    db.KeyTypes.index('Device', 'Entity'),
  ],
});

const DeviceTelemetry = {

  GetByDeviceId(deviceid, entitycode, days = 1) {
    return db.pquery(`
      SELECT dt.DateTime, dt.Data
      FROM DeviceTelemetry dt
      WHERE dt.Device = ? AND
            dt.Entity = ? AND
            dt.DateTime >= NOW() - INTERVAL ? DAY
      ORDER BY dt.DateTime, dt.Id`, [deviceid, entitycode, days]);
  },

  Insert(device, entity, data) {
    return DeviceTelemetryTable.insert({ Device: device, Entity: entity, Data: data });
  },

};

module.exports = DeviceTelemetry;