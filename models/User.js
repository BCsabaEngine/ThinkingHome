const md5 = require('md5');

const UserTable = db.defineTable('User', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    IsAdmin: db.ColTypes.tinyint(1).notNull(),
    Username: db.ColTypes.varchar(100).notNull().unique(),
    Password: db.ColTypes.varchar(100).notNull(),
  },
});

const User = {

  Exists() {
    return UserTable.exists();
  },

  Count() {
    return UserTable.select('COUNT(1) AS Count', '')
      .then(rows => {
        return Promise.resolve(rows[0].Count);
      });
  },

  FindByEmailPassword(username, password) {
    return UserTable.select(['Id', 'IsAdmin'], 'WHERE Username = ? AND Password = ?', [username, md5(password)])
      .then(rows => {
        if (rows.length)
          return Promise.resolve(rows[0]);
        return Promise.resoleve(null);
      });
  },

  Insert(username, password) {
    return UserTable.insert({ Username: username, Password: md5(password) });
  },

  InsertAdminIfNotExists() {
    return this.Exists()
      .then(exists => {
        if (exists)
          return Promise.resolve(true);
        return UserTable.insert({ IsAdmin: 1, Username: "admin", Password: md5("1234") });
      });
  },

};

module.exports = User;
