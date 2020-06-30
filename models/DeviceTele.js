const DeviceTeleTable = db.defineTable('DeviceTele', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).notNull().index(),
    Telemetry: db.ColTypes.varchar(32).notNull(),
    Data: db.ColTypes.float(),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('DateTime', 'Device', 'Telemetry'),
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
    const DeviceTeleScale = require.main.require('./models/DeviceTeleScale');
    const scales = await DeviceTeleScale.FindByDeviceTelemetry(device, telemetry);

    data = Number(data);
    if (scales)
      data = scales.Calc(data);

    await DeviceTeleTable.insert({ Device: device, Telemetry: telemetry, Data: data });
  },

};

module.exports = DeviceTele;