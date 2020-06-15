const DeviceTable = db.defineTable('Device', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).notNull(),
    Module: db.ColTypes.varchar(100),
    DisplayName: db.ColTypes.varchar(100),
    Region: db.ColTypes.int(11),
  },
});

const Device = {
};

module.exports = Device;