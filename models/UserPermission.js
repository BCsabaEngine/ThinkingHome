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

  Insert(user, permission) {
    if (UserPermissions.isDefined(permission)) {
      const up = UserPermissions.get(permissions);
      return UserPermissionTable.insert({ User: user, Permission: up.key });
    }
  },

  Delete(user, permission) {
    if (UserPermissions.isDefined(permission)) {
      const up = UserPermissions.get(permissions);
      return UserPermissionTable.delete({ User: user, Permission: up.key });
    }
  },

  GetByUser(user) {
    return UserPermissionTable.select(['Permission'], 'WHERE User = ? ORDER BY Permission', [user]);
  },

};

global.UserPermissions = new Enum([
  'Users',
  'RuleCode',
  'Restart',
], { freeze: true });

module.exports = UserPermission;
