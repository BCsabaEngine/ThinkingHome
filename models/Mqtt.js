const MqttTable = db.defineTable('Mqtt', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).index(),
    UnknownDevice: db.ColTypes.varchar(100).index(),
    Topic: db.ColTypes.varchar(100).notNull(),
    Payload: db.ColTypes.varchar(512),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('DateTime', 'Device', 'Topic'),
  ],
});

const Mqtt = {

  Insert(device, topic, payload) {
    return MqttTable.insert({ Device: device, Topic: topic, Payload: payload });
  },

  InsertUnknownDevice(devicename, topic, payload) {
    return MqttTable.insert({ UnknownDevice: devicename, Topic: topic, Payload: payload });
  },

  InsertUnknownFormat(topic, payload) {
    return MqttTable.insert({ Topic: topic, Payload: payload });
  },

};

module.exports = Mqtt;