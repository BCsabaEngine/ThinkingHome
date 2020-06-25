const Enum = require('enum');

const UserPermissionTable = db.defineTable('UserPermission', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    User: db.ColTypes.int(11).notNull().index(),
    Permission: db.ColTypes.varchar(100).notNull(),
  },
  keys: [
    db.KeyTypes.foreignKey('User').references('User', 'Id').cascade(),
  ],
});

const UserPermission = {

  async Insert(user, permission) {
    if (UserPermissions.isDefined(permission)) {
      const up = UserPermissions.get(permissions);
      await UserPermissionTable.insert({ User: user, Permission: up.key });
    }
  },

  async Delete(user, permission) {
    if (UserPermissions.isDefined(permission)) {
      const up = UserPermissions.get(permissions);
      await UserPermissionTable.delete({ User: user, Permission: up.key });
    }
  },

  async GetByUser(user) {
    const rows = await UserPermissionTable.select(['Permission'], 'WHERE User = ? ORDER BY Permission', [user]);
    return rows;
  },

};

global.UserPermissions = new Enum([
  'Users',
  'RuleCode',
  'Restart',
], { freeze: true });

module.exports = UserPermission;
