const DeviceCapabilityTable = db.defineTable('DeviceCapability', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Device: db.ColTypes.int(11).index(),
    Value: db.ColTypes.varchar(100).notNull(),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id'),
  ],
});

const DeviceCapability = {
};

module.exports = DeviceCapability;