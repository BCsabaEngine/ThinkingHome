const RuleCodeTable = db.defineTable('RuleCode', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    Name: db.ColTypes.varchar(100).unique(),
    Device: db.ColTypes.int(10).unique(),
    Disabled: db.ColTypes.tinyint(1).notNull(),
    JsCode: db.ColTypes.mediumtext().notNull()
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade()
  ],
  triggers: {
    RuleCode_StoreHistory: `
      CREATE TRIGGER RuleCode_StoreHistory
      AFTER UPDATE ON RuleCode
      FOR EACH ROW
      BEGIN
        IF !(OLD.JsCode <=> NEW.JsCode) THEN
          INSERT INTO RuleCodeHistory
            (Name, Device, JsCode)
          VALUES
            (NEW.Name, NEW.Device, NEW.JsCode);
        END IF;
      END
    `
  }
})

class RuleCodeObject {
  constructor(source) { Object.assign(this, source) }
  get displayname() { return this.Device ? `#${this.DeviceName}` : this.Name }
}
class RuleCodeObjectArray extends Array {
  constructor(sources) {
    super()
    for (const source of sources) this.push(new RuleCodeObject(source))
  }
}

const RuleCodeModel = {

  async CreateByNameSync(name) {
    const res = await RuleCodeTable.insert({ Name: name, Disabled: 0, JsCode: '' })
    return res.insertId
  },
  async CreateForDeviceSync(deviceid) {
    const res = await RuleCodeTable.insert({ Device: deviceid, Disabled: 0, JsCode: '' })
    return res.insertId
  },

  async UpdateJsCodeSync(id, jscode) {
    await RuleCodeTable.update({ JsCode: jscode || '' }, 'WHERE Id = ?', [id])
  },

  async EnableSync(id) {
    await RuleCodeTable.update({ Disabled: 0 }, 'WHERE Id = ?', [id])
  },
  async DisableSync(id) {
    await RuleCodeTable.update({ Disabled: 1 }, 'WHERE Id = ?', [id])
  },

  async DeleteSync(id) {
    await RuleCodeTable.delete('WHERE Id = ?', [id])
  },

  async GetForDeviceSync(deviceid) {
    const result = await db.pquery('SELECT rc.*, d.Name AS DeviceName FROM RuleCode rc LEFT JOIN Device d ON d.Id = rc.Device WHERE rc.Device = ?', [deviceid])
    if (result && result.length) return new RuleCodeObject(result[0])
    return null
  },

  async GetByIdSync(id) {
    const result = await db.pquery('SELECT rc.*, d.Name AS DeviceName FROM RuleCode rc LEFT JOIN Device d ON d.Id = rc.Device WHERE rc.Id = ?', [id])
    if (result && result.length) return new RuleCodeObject(result[0])
    return null
  },
  async GetEnabledSync() {
    return new RuleCodeObjectArray(await db.pquery('SELECT rc.*, d.Name AS DeviceName FROM RuleCode rc LEFT JOIN Device d ON d.Id = rc.Device WHERE rc.Disabled = 0 ORDER BY rc.Id'))
  },
  async GetAllSync() {
    return new RuleCodeObjectArray(await db.pquery('SELECT rc.*, d.Name AS DeviceName FROM RuleCode rc LEFT JOIN Device d ON d.Id = rc.Device ORDER BY rc.Name IS NULL, rc.Name, d.Name'))
  }

}

module.exports = RuleCodeModel
