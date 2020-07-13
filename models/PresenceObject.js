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

  async Insert(name, networkmac) {
    await PresenceObjectTable.insert({ Name: name, NetworkMac: networkmac });
  },

  async GetAllPriorityOrder() {
    const rows = await PresenceObjectTable.select('*', 'ORDER BY Priority, Name');
    return rows;
  },

};

module.exports = PresenceObject;