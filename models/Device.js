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
  async FindById(id) {
    const rows = await DeviceTable.select('*', 'WHERE Id = ?', [id]);
    if (rows.length)
      return rows[0];
    return null;
  },

  async FindByName(name) {
    const rows = await DeviceTable.select('*', 'WHERE Name = ?', [name]);
    if (rows.length)
      return rows[0];
    return null;
  },

  async FindOrCreateByName(name) {
    let rows = await DeviceTable.select('*', 'WHERE Name = ?', [name]);
    if (!rows.length) {
      await db.pquery("INSERT IGNORE INTO Device (Name) VALUES (?)", [name]);
      rows = await DeviceTable.select('*', 'WHERE Name = ?', [name]);
    }
    if (rows.length)
      return rows[0];
    return null;
  },

  async GetAllPriorityOrder() {
    const rows = await DeviceTable.select('*', 'ORDER BY Priority, Name');
    return rows;
  },

};

module.exports = Device;