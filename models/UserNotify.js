const UserNotifyTable = db.defineTable('UserNotify', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Code: db.ColTypes.varchar(100),
    User: db.ColTypes.int(10).notNull(),
    Level: db.ColTypes.int(10).notNull(),
    Icon: db.ColTypes.varchar(3 * 10),
    Subject: db.ColTypes.varchar(100).notNull(),
    Message: db.ColTypes.varchar(1024).notNull(),
    ReadDateTime: db.ColTypes.datetime()
  },
  keys: [
    db.KeyTypes.foreignKey('User').references('User', 'Id').cascade(),
    db.KeyTypes.index('User', 'ReadDateTime', 'Code')
  ]
})

const UserNotifyModel = {

  GetByUserId(userid, limit = 100) {
    return db.pquery(`
      SELECT ud.Id, un.DateTime, un.Level, un.Icon, un.Subject, un.Message, un.ReadDateTime
      FROM UserNotify un
      WHERE un.User = ?
      ORDER BY dt.DateTime DESC, dt.Id DESC
      LIMIT ?`, [userid, limit])
  },

  async GetUnreadByUserIdSync(userid) {
    return await db.pquery(`
      SELECT un.Id, un.DateTime, un.Level, un.Icon, un.Subject, un.Message
      FROM UserNotify un
      WHERE un.User = ? AND
            un.ReadDateTime IS NULL
      ORDER BY un.DateTime DESC, un.Id DESC`, [userid])
  },

  async InsertSync(code, user, level, icon, subject, message) {
    if (code) await this.RemoveUnreadByCodeSync(code)
    return await UserNotifyTable.insert({ Code: code, User: user, Level: level, Icon: icon, Subject: subject, Message: message })
  },

  async MakeReadByIdSync(id, user) {
    return await UserNotifyTable.update('ReadDateTime = NOW WHERE Id = ? AND User = ?', [id, user])
  },

  async RemoveUnreadByCodeSync(code) {
    return await UserNotifyTable.delete('WHERE Code = ? AND ReadDateTime IS NULL', [code])
  }

}

module.exports = UserNotifyModel
