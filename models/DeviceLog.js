const DeviceLogTable = db.defineTable('DeviceLog', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(10).notNull(),
    Entity: db.ColTypes.varchar(100),
    Message: db.ColTypes.varchar(1024).notNull()
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('DateTime'),
    db.KeyTypes.index('Device', 'Entity')
  ]
})

const DeviceLogModel = {

  GetByDeviceId(deviceid, entitycode, days = 1) {
    return db.pquery(`
      SELECT dt.DateTime, dt.Entity, dt.Message
      FROM DeviceLog dt
      WHERE dt.Device = ? AND
            dt.Entity = ? AND
            dt.DateTime >= NOW() - INTERVAL ? DAY
      ORDER BY dt.DateTime, dt.Id`, [deviceid, entitycode, days])
  },

  async InsertDeviceLogSync(device, message) {
    return await DeviceLogTable.insert({ Device: device, Message: message })
  },

  async InsertEntityLogSync(device, entity, message) {
    return await DeviceLogTable.insert({ Device: device, Entity: entity, Message: message })
  }
}

module.exports = DeviceLogModel
