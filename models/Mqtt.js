const MqttTable = db.defineTable('Mqtt', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).index(),
    Topic: db.ColTypes.varchar(100).notNull(),
    Payload: db.ColTypes.varchar(512),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
  ],
});

const Mqtt = {
};

module.exports = Mqtt;