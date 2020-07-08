const DeviceStatTable = db.defineTable('DeviceStat', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).notNull().index(),
    Stat: db.ColTypes.varchar(100).notNull(),
    Data: db.ColTypes.varchar(512),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('DateTime', 'Device', 'Stat'),
  ],
  triggers: {
    UpdateSeries: `
      CREATE TRIGGER UpdateSeries
      AFTER INSERT ON DeviceStat
      FOR EACH ROW
      BEGIN
        UPDATE DeviceStatSeries dss
        SET dss.DateTimeEnd = NOW()
        WHERE dss.Device = NEW.Device AND
              dss.Stat = NEW.Stat AND
              dss.DateTimeEnd IS NULL AND
              dss.Data != NEW.Data;
        
        IF NOT EXISTS(SELECT 1
                      FROM DeviceStatSeries dss
                      WHERE dss.Device = NEW.Device AND
                      dss.Stat = NEW.Stat AND
                      dss.DateTimeEnd IS NULL AND
                      dss.Data = NEW.Data) THEN
          INSERT INTO DeviceStatSeries
            (Device, Stat, Data)
        VALUES
            (NEW.Device, NEW.Stat, NEW.Data);
        END IF;
      END;`
  },
});

const DeviceStat = {

  /*
    async GetLastByDeviceId(deviceid) {
      const rows = await db.pquery(`
        SELECT de.Event, de.Data, de.DateTime
        FROM DeviceEvent de
        WHERE de.Device = ? AND
              NOT EXISTS(SELECT 1
                         FROM DeviceEvent de2
                         WHERE de2.Device = de.Device AND
                               de2.Event = de.Event AND
                               de2.Id > de.Id)
        ORDER BY de.Event`, [deviceid]);
      return rows;
    },
  */

  async Insert(device, stat, data) {
    await DeviceStatTable.insert({ Device: device, Stat: stat, Data: data });
  },

};

module.exports = DeviceStat;