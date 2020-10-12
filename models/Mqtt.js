const MqttTable = db.defineTable('Mqtt', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(10).index(),
    UnknownDevice: db.ColTypes.varchar(100).index(),
    Topic: db.ColTypes.varchar(100).notNull(),
    Payload: db.ColTypes.varchar(1024)
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('DateTime', 'Device', 'Topic')
  ]
})

const MqttModel = {

  Insert(device, topic, payload) {
    return MqttTable.insert({ Device: device, Topic: topic, Payload: payload })
  },

  InsertUnknownDevice(devicename, topic, payload) {
    return MqttTable.insert({ UnknownDevice: devicename, Topic: topic, Payload: payload })
  },

  InsertUnknownFormat(topic, payload) {
    return MqttTable.insert({ Topic: topic, Payload: payload })
  },

  async GetUnknownDevices(hours = 12) {
    const devices = []
    for (const row of await db.pquery('SELECT DISTINCT m.UnknownDevice FROM Mqtt m WHERE m.UnknownDevice IS NOT NULL AND m.DateTime > DATE_SUB(NOW(), INTERVAL ? HOUR) ORDER BY 1', [hours])) { devices.push(row.UnknownDevice) }
    return devices
  }

}

module.exports = MqttModel
