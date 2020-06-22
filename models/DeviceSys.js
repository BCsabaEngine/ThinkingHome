const DeviceSysItem = requireRoot('/models/DeviceSysItem');

const DeviceSysTable = db.defineTable('DeviceSys', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).index(),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
  ],
});

const DeviceSys = {
  async FindLastByDeviceId(deviceid) {
    const rows = await db.pquery("SELECT * FROM DeviceSys ds WHERE ds.Device = ? ORDER BY ds.Id DESC LIMIT 1", [deviceid]);
    if (rows) {
      rows[0].Items = await DeviceSysItem.GetByDeviceSysId(rows[0].Id);
      return rows[0];
    }
    return null;
  },
};

module.exports = DeviceSys;