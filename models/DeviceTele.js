const DeviceTeleTable = db.defineTable('DeviceTele', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).notNull().index(),
    Telemetry: db.ColTypes.varchar(32).notNull().index(),
    Data: db.ColTypes.varchar(32),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
  ],
});

const DeviceTele = {

  async GetLastByDeviceId(deviceid, telemetry, days = 1) {
    const rows = await db.pquery(`
      SELECT dt.DateTime, dt.Data
      FROM DeviceTele dt
      WHERE dt.Device = ? AND
            dt.Telemetry = ? AND
            dt.DateTime >= NOW() - INTERVAL ? DAY
      ORDER BY dt.DateTime, dt.Id`, [deviceid, telemetry, days]);
    return rows;
  },

  async Insert(device, telemetry, data) {
    await DeviceTeleTable.insert({ Device: device, Telemetry: telemetry, Data: data });
  },

};

module.exports = DeviceTele;