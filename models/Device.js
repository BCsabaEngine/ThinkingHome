const DeviceTable = db.defineTable('Device', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).notNull().unique(),
    DisplayName: db.ColTypes.varchar(100),
    LocationName: db.ColTypes.varchar(100),
    FaIcon: db.ColTypes.varchar(20),
    Color: db.ColTypes.varchar(6),
    Priority: db.ColTypes.int(11).notNull(),
  },
});

const Device = {
  FindById(id) {
    DeviceTable.select('*', 'WHERE Id = ?', [id])
      .then(rows => {
        if (rows.length)
          Promise.resolve(rows[0]);
        Promise.resolve(null);
      });
  },

  FindByName(name) {
    return DeviceTable.select('*', 'WHERE Name = ?', [name])
      .then(rows => {
        if (rows.length)
          return Promise.resolve(rows[0]);
        throw new Error(`Device not found: ${name}`);
      });
  },

  FindOrCreateByName(name) {
    return DeviceTable.select('*', 'WHERE Name = ?', [name])
      .then(rows => {
        if (rows.length)
          return Promise.resolve(rows[0]);

        db.pquery("INSERT IGNORE INTO Device (Name) VALUES (?)", [name])
          .then(() => {
            DeviceTable.select('*', 'WHERE Name = ?', [name])
              .then(newrows => {
                if (newrows.length)
                  return Promise.resolve(newrows[0]);
              });
          });
        return Promise.reject(`Cannot create device '${name}'`);
      });
  },

  GetAllPriorityOrder() {
    return DeviceTable.select('*', 'ORDER BY Priority, Name');
  },

};

module.exports = Device;