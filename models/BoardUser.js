const BoardUserTable = db.defineTable('BoardUser', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    User: db.ColTypes.int(11).notNull().index(),
    Board: db.ColTypes.int(11).notNull().index(),
  },
  keys: [
    db.KeyTypes.foreignKey('User').references('User', 'Id').cascade(),
    db.KeyTypes.foreignKey('Board').references('Board', 'Id').cascade(),
    db.KeyTypes.uniqueIndex('User', 'Board'),
  ],
});

const BoardUserModel = {

  async AllowSync(user, board) {
    const exists = await BoardUserTable.exists('WHERE User = ? AND Board = ?', [user, board])
    if (exists)
      return;
    const res = await BoardUserTable.insert({ User: user, Board: board });
    return res.insertId;
  },

  async RevokeSync(user, board) {
    await BoardUserTable.delete('WHERE User = ? AND Board = ?', [user, board]);
  },

};

module.exports = BoardUserModel;
