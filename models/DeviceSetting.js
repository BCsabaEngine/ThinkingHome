const DeviceSettingTable = db.defineTable('DeviceSetting', {
  columns: {
    Id: db.ColTypes.int(0).notNull().primaryKey().autoIncrement(),
    Device: db.ColTypes.int(10).notNull().index(),
    Name: db.ColTypes.varchar(100).notNull(),
    Value: db.ColTypes.varchar(100)
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade()
  ]
})

const DeviceSettingModel = {

  async GetSettingsSync(deviceid) {
    const result = {}
    for (const row of await DeviceSettingTable.select(['Name', 'Value'], 'WHERE Device = ?', [deviceid])) { result[row.Name] = row.Value }
    return result
  },

  async UpdateSettingSync(deviceid, name, value) {
    await DeviceSettingTable.delete('WHERE Device = ? AND Name = ?', [deviceid, name])
    if (value) { await DeviceSettingTable.insert({ Device: deviceid, Name: name, Value: value }) }
  },

  async UpdateSettingsSync(deviceid, settingobj) {
    await DeviceSettingTable.delete('WHERE Device = ?', [deviceid])
    for (const [name, value] of Object.entries(settingobj)) {
      await DeviceSettingTable.insert({ Device: deviceid, Name: name, Value: value })
    }
  }

}

module.exports = DeviceSettingModel
