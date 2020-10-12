const PlatformTable = db.defineTable('Platform', {
  columns: {
    Code: db.ColTypes.varchar(100).notNull().primaryKey(),
    Enabled: db.ColTypes.tinyint(1).notNull()
  }
})

const PlatformModel = {

  async EnableSync(code) {
    if (await PlatformTable.exists('WHERE Code = ?', [code])) {
      await PlatformTable.update({ Enabled: 1 }, 'WHERE Code = ?', [code])
    } else {
      await PlatformTable.insert({ Code: code, Enabled: 1 })
    }
  },

  async DisableSync(code) {
    await PlatformTable.update({ Enabled: 0 }, 'WHERE Code = ?', [code])
  },

  async GetEnabledPlatformCodesSync() {
    const codes = []
    for (const row of await PlatformTable.select(['Code'], 'WHERE Enabled = 1')) { codes.push(row.Code) }
    return codes
  }

}

module.exports = PlatformModel
