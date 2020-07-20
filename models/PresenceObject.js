const PresenceObjectTable = db.defineTable('PresenceObject', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).notNull(),
    DisplayName: db.ColTypes.varchar(100),
    NetworkMac: db.ColTypes.varchar(24).notNull(),
    FaIcon: db.ColTypes.varchar(20),
    Priority: db.ColTypes.int(11).notNull(),
  },
});

const PresenceObject = {

  Insert(name, networkmac) {
    return PresenceObjectTable.insert({ Name: name, NetworkMac: networkmac });
  },

  GetAllPriorityOrder() {
    return PresenceObjectTable.select('*', 'ORDER BY Priority, Name');
  },

};

module.exports = PresenceObject;