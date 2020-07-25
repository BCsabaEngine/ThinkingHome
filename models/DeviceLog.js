const DeviceLogTable = db.defineTable('DeviceLog', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).notNull().index(),
    Message: db.ColTypes.varchar(512),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('DateTime', 'Device'),
  ],
});

const DeviceLog = {

  GetAllByDeviceId(deviceid) {
    return db.pquery("SELECT dl.DateTime, dl.Message FROM DeviceLog dl WHERE dl.Device = ?  AND dl.DateTime > NOW() - INTERVAL 7 DAY", [deviceid]);
  },

  Insert(device, message) {
    return DeviceLogTable.insert({ Device: device, Message: message });
  },

};

module.exports = DeviceLog;