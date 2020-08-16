const PresenceObjectMarkerTable = db.defineTable('PresenceObjectMarker', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    PresenceObject: db.ColTypes.int(11).notNull().index(),
    Type: db.ColTypes.varchar(100).notNull(),
    Marker: db.ColTypes.varchar(100).notNull(),
  },
  keys: [
    db.KeyTypes.foreignKey('PresenceObject').references('PresenceObject', 'Id').cascade(),
  ],
});

const PresenceObjectMarker = {

  InsertNetworkMac(presenceobjectid, networkmac) {
    return PresenceObjectMarkerTable.insert({ PresenceObject: presenceobjectid, Type: "network", Marker: networkmac });
  },

  InsertBleMac(presenceobjectid, blemac) {
    return PresenceObjectMarkerTable.insert({ PresenceObject: presenceobjectid, Type: "ble", Marker: blemac });
  },

  GetAll() {
    return PresenceObjectMarkerTable.select('*', '');
  },

  GetByPresenceObject(presenceobject) {
    return PresenceObjectMarkerTable.select('*', 'WHERE PresenceObject = ?', [presenceobject]);
  },

};

module.exports = PresenceObjectMarker;