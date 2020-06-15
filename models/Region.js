const RegionTable = db.defineTable('Region', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).notNull().unique(),
  },
});

const Region = {
};

module.exports = Region;