const DeviceEventTable = db.defineTable('DeviceEvent', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(10).notNull().index(),
    Entity: db.ColTypes.varchar(100).notNull(),
    Event: db.ColTypes.varchar(100).notNull()
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('DateTime'),
    db.KeyTypes.index('Device', 'Entity')
  ]
})

const DeviceEventModel = {

  GetByDeviceId(deviceid, entitycode, days = 1) {
    return db.pquery(`
      SELECT dt.DateTime, dt.Event
      FROM DeviceEvent dt
      WHERE dt.Device = ? AND
            dt.Entity = ? AND
            dt.DateTime >= NOW() - INTERVAL ? DAY
      ORDER BY dt.DateTime, dt.Id`, [deviceid, entitycode, days])
  },

  async InsertSync(device, entity, event) {
    return await DeviceEventTable.insert({ Device: device, Entity: entity, Event: event })
  }

}

module.exports = DeviceEventModel
