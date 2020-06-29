const md5 = require('md5');
const { permittedCrossDomainPolicies } = require('helmet');

const UserTable = db.defineTable('User', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    IsAdmin: db.ColTypes.tinyint(1).notNull(),
    Username: db.ColTypes.varchar(100).notNull().unique(),
    Password: db.ColTypes.varchar(100).notNull(),
  },
});

const User = {

  async Exists() {
    return await UserTable.exists();
  },

  async Count() {
    const rows = await UserTable.select('COUNT(1) AS Count', '');
    return rows[0].Count;
  },

  async FindByEmailPassword(username, password) {
    const rows = await UserTable.select(['Id', 'IsAdmin'], 'WHERE Username = ? AND Password = ?', [username, md5(password)]);
    if (rows.length)
      return rows[0];
    return null;
  },

  async Insert(username, password) {
    await UserTable.insert({ Username: username, Password: md5(password) });
  },

  async InsertAdminIfNotExists() {
    if (!await this.Exists())
      await UserTable.insert({ IsAdmin: 1, Username: "admin", Password: md5("1234") });
  },

};

module.exports = User;
