const SystemSettingTable = db.defineTable('SystemSetting', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).notNull().unique(),
    Value: db.ColTypes.varchar(100).notNull()
  }
})

const SystemSettingModel = {

  StoreAll(rows) {
    return SystemSettingTable.delete()
      .then(() => {
        rows.forEach(row => SystemSettingTable.insert(row))
      })
  },

  GetAll() {
    return SystemSettingTable.select('*', '')
  }
}

module.exports = SystemSettingModel
