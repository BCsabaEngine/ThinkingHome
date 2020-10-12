const PlatformSettingTable = db.defineTable('PlatformSetting', {
  columns: {
    Platform: db.ColTypes.varchar(100).notNull(),
    Name: db.ColTypes.varchar(100).notNull(),
    Value: db.ColTypes.varchar(100)
  },
  primaryKey: ['Platform', 'Name'],
  keys: [
    db.KeyTypes.foreignKey('Platform').references('Platform', 'Code').cascade()
  ]
})

const PlatformSettingModel = {

  async GetSettingsSync(platformcode) {
    const result = {}
    for (const row of await PlatformSettingTable.select(['Name', 'Value'], 'WHERE Platform = ?', [platformcode])) { result[row.Name] = row.Value }
    return result
  },

  async UpdateSettingSync(platformcode, name, value) {
    await PlatformSettingTable.delete('WHERE Platform = ? AND Name = ?', [platformcode, name])
    if (value) { await PlatformSettingTable.insert({ Platform: platformcode, Name: name, Value: value }) }
  },

  async UpdateSettingsSync(platformcode, settingobj) {
    await PlatformSettingTable.delete('WHERE Platform = ?', [platformcode])
    for (const [name, value] of Object.entries(settingobj)) { await PlatformSettingTable.insert({ Platform: platformcode, Name: name, Value: value }) }
  }

}

module.exports = PlatformSettingModel
