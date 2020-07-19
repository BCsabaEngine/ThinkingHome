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
  GetAllByDeviceId(deviceid) {
    return db.pquery("SELECT dc.Id, dc.Name, dc.Value FROM DeviceConfig dc WHERE dc.Device = ? ORDER BY dc.Name, dc.Value", [deviceid]);
  },

  Insert(device, name, value) {
    return DeviceConfigTable.insert({ Device: device, Name: name, Value: value, });
  },

  Update(device, id, value) {
    return DeviceConfigTable.update({ Value: value }, 'WHERE Device = ? AND Id = ?', [device, id]);
  },

  Delete(device, id) {
    return DeviceConfigTable.delete('WHERE Device = ? AND Id = ?', [device, id]);
  },

};

module.exports = DeviceConfig;