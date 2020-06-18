const DeviceEventTable = db.defineTable('DeviceEvent', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).index(),
    Event: db.ColTypes.varchar(100),
    Data: db.ColTypes.varchar(512),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
  ],
});

const DeviceEvent = {
};

module.exports = DeviceEvent;