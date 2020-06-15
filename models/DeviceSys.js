const DeviceSysTable = db.defineTable('DeviceSys', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).index(),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id'),
  ],
});

const DeviceSys = {
};

module.exports = DeviceSys;