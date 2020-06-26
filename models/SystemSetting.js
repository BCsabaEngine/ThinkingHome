const SystemSettingTable = db.defineTable('SystemSetting', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).notNull().unique(),
    Value: db.ColTypes.varchar(100).notNull(),
  },
});

const SystemSetting = {

  async StoreAll(rows) {
    await SystemSettingTable.delete();
    rows.forEach(async function (rowobj) {
      await SystemSettingTable.insert(rowobj);
    });
  },

  async GetAll() {
    const rows = await SystemSettingTable.select('*', '');
    return rows;
  },
};

module.exports = SystemSetting;
