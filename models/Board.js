const BoardTable = db.defineTable('Board', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    IsPrimary: db.ColTypes.tinyint(1).notNull(),
    Name: db.ColTypes.varchar(100).notNull(),
    Yaml: db.ColTypes.mediumtext(),
  },
  triggers: {
    Board_StoreHistory: `
      CREATE TRIGGER Board_StoreHistory
      AFTER UPDATE ON Board
      FOR EACH ROW
        INSERT INTO BoardHistory (Board, Yaml) VALUES (NEW.Id, NEW.Yaml)`,
  },
});

const BoardModel = {

  async AnySync() {
    return await BoardTable.exists();
  },

  async GetByIdSync(id) {
    const res = await BoardTable.select('*', 'WHERE Id = ?', [id]);
    if (res && res.length)
      return res[0];
    return null;
  },

  async GetAllByUserSync(userid) {
    return await db.pquery(`SELECT b.*
                    FROM Board b
                    WHERE (
                            EXISTS (SELECT 1 FROM BoardUser bu WHERE bu.Board = b.Id AND bu.User = ?)
                          OR
                            NOT EXISTS (SELECT 1 FROM BoardUser bu WHERE bu.Board = b.Id)
                          )
                    ORDER BY b.IsPrimary DESC, b.Name ASC`, [userid]);
  },

  async GetAllSync() {
    return await db.pquery(`SELECT b.*
                    FROM Board b
                    ORDER BY b.IsPrimary DESC, b.Name ASC`);
  },

  async InsertSync(name, yaml) {
    const any = await this.AnySync();
    const isprimary = !any;
    const res = await BoardTable.insert({ IsPrimary: isprimary, Name: name, Yaml: yaml || "" });
    return res.insertId;
  },

  async SetPrimarySync(id) {
    await BoardTable.update({ IsPrimary: 0 }, 'WHERE Id != ?', [id]);
    await BoardTable.update({ IsPrimary: 1 }, 'WHERE Id = ?', [id]);
  },

  async UpdateYamlSync(id, yaml) {
    await BoardTable.update({ Yaml: yaml }, 'WHERE Id = ?', [id]);
  },

  async UpdateNameSync(id, name) {
    await BoardTable.update({ Name: name }, 'WHERE Id = ?', [id]);
  },

  async DeleteSync(id) {
    await BoardTable.delete('WHERE Id = ?', [id]);
  },

};

module.exports = BoardModel;
