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
  async Insert(device, message) {
    await DeviceLogTable.insert({ Device: device, Message: message });
  },
};

module.exports = DeviceLog;