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

  FindByDeviceTelemetry(deviceid, telemetry) {

    const cachekey = `${deviceid}` + telemetry;

    if (this._cache[cachekey] !== undefined)
      return Promise.resolve(this._cache[cachekey]);

    return DeviceTeleScaleTable.select(['Scale', 'Diff'], 'WHERE Device = ? AND Telemetry = ?', [deviceid, telemetry])
      .then(rows => {
        let result = null;
        if (rows.length) {
          let scale = rows[0].Scale;
          if (!scale)
            scale = 1;

          const diff = rows[0].Diff;
          result = { Scale: scale, Diff: diff, Calc: (value) => value * scale + diff };
        }
        this._cache[cachekey] = result;

        return Promise.resolve(result);
      });
  },

  Insert(device, telemetry, data) {
    this._cache = {};
    DeviceTeleScale.insert({ Device: device, Telemetry: telemetry, Data: Number(data) });
  },

};

module.exports = DeviceTeleScale;