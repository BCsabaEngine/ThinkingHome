const DeviceSysItemTable = db.defineTable('DeviceSysItem', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DeviceSys: db.ColTypes.int(11).index(),
    Name: db.ColTypes.varchar(100).notNull(),
    Value: db.ColTypes.varchar(100).notNull(),
  },
  keys: [
    db.KeyTypes.foreignKey('DeviceSys').references('DeviceSys', 'Id'),
  ],
});

const DeviceSysItem = {
};

module.exports = DeviceSysItem;