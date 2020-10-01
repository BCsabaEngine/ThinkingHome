const DeviceTable = db.defineTable('Device', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).notNull().unique(),
    Platform: db.ColTypes.varchar(100).notNull().index(),
    Type: db.ColTypes.varchar(100).notNull(),
    Enabled: db.ColTypes.tinyint(1).notNull(),
  },
  keys: [
    db.KeyTypes.foreignKey('Platform').references('Platform', 'Code').cascade(),
  ],
});

const DeviceModel = {

  async GetPlatformDevicesSync(platformcode) {
    return await DeviceTable.select('*', 'WHERE Platform = ? AND Enabled = 1 ORDER BY Name', [platformcode]);
  },

  async FindFirstAvailableNameSync(name) {
    let result = name.toLowerCase();
    let index = 1;
    while (await DeviceTable.exists('WHERE Name = ?', [result])) {
      index++;
      if (index > 100) throw new Error(`Cannot calculate device name for '${name}'`);
      result = name + index.toString();
    }
    return result;
  },

  async InsertSync(name, platform, type) {
    const res = await DeviceTable.insert({ Name: name, Platform: platform, Type: type, Enabled: 1 });
    return res.insertId;
  },

  async DeleteSync(id, platform) {
    await DeviceTable.delete('WHERE Id = ? AND Platform = ?', [id, platform]);
  },

};

module.exports = DeviceModel;
