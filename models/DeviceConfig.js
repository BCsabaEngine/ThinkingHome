const DeviceConfigTable = db.defineTable('DeviceConfig', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Device: db.ColTypes.int(11).notNull().index(),
    Name: db.ColTypes.varchar(100),
    Value: db.ColTypes.varchar(100),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
  ],
});

const DeviceConfig = {
  async GetAllByDeviceId(deviceid) {
    const rows = await db.pquery("SELECT dc.Name, dc.Value FROM DeviceConfig dc WHERE dc.Device = ? ORDER BY dc.Name, dc.Value", [deviceid]);
    return rows;
  },

  async Insert(device, name, value) {
    await DeviceConfigTable.insert({ Device: device, Name: name, Value: value, });
  },
};

module.exports = DeviceConfig;