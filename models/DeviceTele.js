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

  // async GetLastByDeviceId(deviceid, telemetry) {
  //   const rows = await db.pquery(`
  //     SELECT dt.Data, dt.DateTime
  //     FROM DeviceTele dt
  //     WHERE dt.Device = ? AND
  //           dt.Telemetry = ? AND
  //           NOT EXISTS(SELECT 1
  //                      FROM DeviceTele dt2
  //                      WHERE dt2.Device = dt.Device AND
  //                            dt2.Telemetry = dt.Telemetry AND
  //                            dt2.Id > dt.Id)
  //     ORDER BY dt.Id DESC`, [deviceid, telemetry]);
  //   return rows;
  // },

  async Insert(device, telemetry, data) {
    await DeviceTeleTable.insert({ Device: device, Telemetry: telemetry, Data: data });
  },

};

module.exports = DeviceTele;