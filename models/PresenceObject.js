const PresenceObjectTable = db.defineTable('PresenceObject', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).notNull(),
    DisplayName: db.ColTypes.varchar(100),
    FaIcon: db.ColTypes.varchar(20),
    Priority: db.ColTypes.int(11).notNull(),
  },
});

const PresenceObject = {

  GetAllPriorityOrder() {
    return PresenceObjectTable.select('*', 'ORDER BY Priority, Name');
  },

};

module.exports = PresenceObject;