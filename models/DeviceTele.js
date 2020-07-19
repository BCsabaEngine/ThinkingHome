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

  GetByDeviceId(deviceid, telemetry, days = 1) {
    return db.pquery(`
      SELECT dt.DateTime, dt.Data
      FROM DeviceTele dt
      WHERE dt.Device = ? AND
            dt.Telemetry = ? AND
            dt.DateTime >= NOW() - INTERVAL ? DAY
      ORDER BY dt.DateTime, dt.Id`, [deviceid, telemetry, days]);
  },

  Insert(device, telemetry, data) {
    const DeviceTeleScale = require.main.require('./models/DeviceTeleScale');
    return DeviceTeleScale.FindByDeviceTelemetry(device, telemetry)
      .then(scales => {
        data = Number(data);
        if (scales)
          data = scales.Calc(data);
        return Promise.resolve(data);
      })
      .then(data => {
        return DeviceTeleTable.insert({ Device: device, Telemetry: telemetry, Data: data });
      });
  },

};

module.exports = DeviceTele;