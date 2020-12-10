const md5 = require('md5')
const stringUtils = require('../lib/stringUtils')

const md5hashlength = 32

const DeviceDataTable = db.defineTable('DeviceData', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    Device: db.ColTypes.int(10).notNull().index(),
    KeyHash: db.ColTypes.varchar(md5hashlength).notNull().unique(),
    Key: db.ColTypes.varchar(1024),
    Value: db.ColTypes.mediumblob()
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade()
  ]
})

const DeviceDataModel = {

  async GetDeviceKeysSync(deviceid) {
    const result = {}
    for (const row of await DeviceDataTable.select(['Id', 'Key'], 'WHERE Device = ?', [deviceid])) {
      result[row.Id] = row.Key
    }
    return result
  },

  async GetDeviceDataByIdSync(deviceid, id) {
    const rows = await DeviceDataTable.select(['KeyHash', 'Key', 'Value'], 'WHERE Device = ? AND Id = ?', [deviceid, id])
    if (rows && rows.length) return stringUtils.unbox(rows[0].Value)
  },

  async GetDeviceDataByKeySync(deviceid, key) {
    const rows = await DeviceDataTable.select(['KeyHash', 'Key', 'Value'], 'WHERE Device = ? AND KeyHash = ?', [deviceid, md5(key)])
    if (rows && rows.length && rows[0].Key === key) return stringUtils.unbox(rows[0].Value)
  },

  async UpdateDataByKeySync(deviceid, key, value) {
    await this.DeleteDataByKeySync(deviceid, key)
    return await DeviceDataTable.insert({ Device: deviceid, KeyHash: md5(key), Key: key, Value: stringUtils.box(value) })
  },

  async DeleteDataByKeySync(deviceid, key) {
    await DeviceDataTable.delete('WHERE Device = ? AND KeyHash = ?', [deviceid, md5(key)])
  }

}

module.exports = DeviceDataModel
