const DeviceStateTable = db.defineTable('DeviceState', {
  columns: {
    Id: db.ColTypes.int(10).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(10).notNull(),
    Entity: db.ColTypes.varchar(100).notNull(),
    State: db.ColTypes.varchar(100)
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('DateTime'),
    db.KeyTypes.index('Device', 'Entity')
  ],
  triggers: {
    DeviceState_UpdateSeries: `
      CREATE TRIGGER DeviceState_UpdateSeries
      AFTER INSERT ON DeviceState
      FOR EACH ROW
      BEGIN
        UPDATE DeviceStateSeries dss
        SET dss.DateTimeEnd = NOW()
        WHERE dss.Device = NEW.Device AND
              dss.Entity = NEW.Entity AND
              dss.DateTimeEnd IS NULL AND
              dss.State != NEW.State;
        
        IF NOT EXISTS(SELECT 1
                      FROM DeviceStateSeries dss
                      WHERE dss.Device = NEW.Device AND
                      dss.Entity = NEW.Entity AND
                      dss.DateTimeEnd IS NULL AND
                      dss.State = NEW.State) THEN
          INSERT INTO DeviceStateSeries
            (Device, Entity, State)
          VALUES
            (NEW.Device, NEW.Entity, NEW.State);
        END IF;
      END;`
  }
})

const DeviceStateModel = {

  GetByDeviceId(deviceid, entitycode, days = 1) {
    return db.pquery(`
      SELECT dt.DateTime, dt.State
      FROM DeviceState dt
      WHERE dt.Device = ? AND
            dt.Entity = ? AND
            dt.DateTime >= NOW() - INTERVAL ? DAY
      ORDER BY dt.DateTime, dt.Id`, [deviceid, entitycode, days])
  },

  async GetLastState(deviceid, entitycode) {
    const last = await db.pquery(`
      SELECT dt.State
      FROM DeviceState dt
      WHERE dt.Device = ? AND
            dt.Entity = ?
      ORDER BY dt.DateTime DESC, dt.Id DESC LIMIT 1`, [deviceid, entitycode])
    if (last && last.length) return last[0].State

    return null
  },

  async InsertSync(device, entity, state) {
    return await DeviceStateTable.insert({ Device: device, Entity: entity, State: state })
  }

}

module.exports = DeviceStateModel
