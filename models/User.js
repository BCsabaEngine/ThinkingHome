const crypto = require('crypto')

const UserTable = db.defineTable('User', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    IsAdmin: db.ColTypes.tinyint(1).notNull(),
    Email: db.ColTypes.varchar(100).notNull().unique(),
    Name: db.ColTypes.varchar(100).notNull(),
    // eslint-disable-next-line no-magic-numbers
    Password: db.ColTypes.varchar(128).notNull() // sha512 in hex format
  }
})

const User = {

  hashPassword(pwd, salt) { return crypto.createHmac('sha512', salt).update(pwd).digest('hex') },

  async AnySync() {
    return await UserTable.exists()
  },

  Count() {
    return UserTable.select('COUNT(1) AS Count', '')
      .then(rows => {
        return Promise.resolve(rows[0].Count)
      })
  },

  async ExistsSync(email) {
    return await UserTable.exists('WHERE Email = ?', [email.trim()])
  },

  async GetAllSync() {
    return await db.pquery(`SELECT u.Id, u.IsAdmin, u.Email, u.Name,
                            (SELECT MAX(wa.DateTime)
                            FROM WebAccess wa
                            WHERE wa.User = u.Id) AS LastActivity
                    FROM User u
                    ORDER BY u.Id`)
  },

  FindByEmailPassword(email, password) { return this.FindByEmailPasswordHash(email, this.hashPassword(password, email.trim())) },

  FindByEmailPasswordHash(email, passwordhash) {
    return UserTable.select(['Id', 'IsAdmin', 'Email', 'Name'], 'WHERE Email = ? AND Password = ?', [email.trim(), passwordhash])
      .then(rows => {
        if (rows.length) { return Promise.resolve(rows[0]) }
        return Promise.resolve(null)
      })
  },

  FindByIdPasswordHash(id, passwordhash) {
    return UserTable.select(['Id', 'IsAdmin', 'Email', 'Name'], 'WHERE Id = ? AND Password = ?', [id, passwordhash])
      .then(rows => {
        if (rows.length) { return Promise.resolve(rows[0]) }
        return Promise.resolve(null)
      })
  },

  TryRealname(email) {
    let result = ''
    for (const c of email.trim().split('@')[0]) {
      if (c < '0' || c > '9') { result += c }
    }

    if (result) { result = result.charAt(0).toUpperCase() + result.slice(1) }

    return result
  },

  async Insert(email, password) {
    const any = await this.AnySync()
    const isadmin = !any

    const name = this.TryRealname(email.trim())

    const insertres = await UserTable.insert({ IsAdmin: isadmin, Email: email.trim(), Name: name, Password: this.hashPassword(password, email.trim()) })

    return { isadmin: isadmin, insertid: insertres.insertId, name: name }
  },

  async UpdateSync(name, email) {
    await UserTable.update({ Name: name.trim() }, 'WHERE Email = ?', [email])
  },

  async DeleteSync(email) {
    await UserTable.delete('WHERE Email = ? AND IsAdmin = 0', [email])
  }

}

module.exports = User
