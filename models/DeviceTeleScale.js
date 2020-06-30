const DeviceTeleScaleTable = db.defineTable('DeviceTeleScale', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Device: db.ColTypes.int(11).notNull().index(),
    Telemetry: db.ColTypes.varchar(32).notNull(),
    Scale: db.ColTypes.float().notNull(),
    Diff: db.ColTypes.float().notNull(),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.uniqueIndex('Device', 'Telemetry'),
  ],
});

const DeviceTeleScale = {

  _cache: {},

  async FindByDeviceTelemetry(deviceid, telemetry) {

    const cachekey = `${deviceid}` + telemetry;

    if (this._cache[cachekey] !== undefined) {
      return this._cache[cachekey];
    }

    let result = null;

    const rows = await DeviceTeleScaleTable.select(['Scale', 'Diff'], 'WHERE Device = ? AND Telemetry = ?', [deviceid, telemetry]);
    if (rows.length) {

      let scale = rows[0].Scale;
      if (!scale)
        scale = 1;

      const diff = rows[0].Diff;

      result = { Scale: scale, Diff: diff, Calc: (value) => value * scale + diff };
    }

    this._cache[cachekey] = result;

    return result;
  },

  async Find(deviceid, telemetry) {
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
    await DeviceTeleScale.insert({ Device: device, Telemetry: telemetry, Data: Number(data) });
    this._cache = {};
  },

};

module.exports = DeviceTeleScale;