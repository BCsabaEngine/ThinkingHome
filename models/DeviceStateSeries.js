const DeviceStateSeriesTable = db.defineTable('DeviceStateSeries', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Device: db.ColTypes.int(11).notNull().index(),
    Entity: db.ColTypes.varchar(32).notNull(),
    DateTimeStart: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    DateTimeEnd: db.ColTypes.datetime(),
    State: db.ColTypes.varchar(100),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('DateTimeStart'),
    db.KeyTypes.index('Device', 'Entity', 'DateTimeEnd'),
  ],
});

const DeviceStateSeries = {

  GetByDeviceId(deviceid, entity, days = 1) {
    return db.pquery(`
      SELECT
        dss.State,
        dss.DateTimeStart,
        COALESCE(dss.DateTimeEnd, NOW()) AS DateTimeEnd,
        TIMESTAMPDIFF(MINUTE, dss.DateTimeStart, COALESCE(dss.DateTimeEnd, NOW())) AS Minute
      FROM DeviceStateSeries dss
      WHERE dss.Device = ? AND
            dss.Entity = ? AND
            (dss.DateTimeStart >= NOW() - INTERVAL ? DAY
             OR
             dss.DateTimeEnd >= NOW() - INTERVAL ? DAY)
      ORDER BY dss.DateTimeStart, dss.Id`, [deviceid, entity, days, days]);
  },

  GetAllByDeviceId(deviceid, days) {
    return db.pquery(`
      SELECT
        dss.Entity,
        dss.State,
        dss.DateTimeStart,
        COALESCE(dss.DateTimeEnd, NOW()) AS DateTimeEnd
      FROM DeviceStateSeries dss
      WHERE dss.Device = ? AND
            (dss.DateTimeStart >= NOW() - INTERVAL ? DAY
             OR
             dss.DateTimeEnd >= NOW() - INTERVAL ? DAY)
      ORDER BY dss.DateTimeStart, dss.Id`, [deviceid, days, days]);
  },

  NormalizeByStartDate(rows, startdate) {
    for (const row of rows)
      if (row.DateTimeStart.getTime() < startdate.getTime())
        row.DateTimeStart = startdate;
    return rows;
  },

  GenerateTimelineStat(rows) {
    const result = {
      timeline: [],
      time: '0:00',
      percent: 0,
    };

    let onminutes = 0;
    let allminutes = 0;
    for (const row of rows) {
      result.timeline.push([row.DateTimeStart.getTime(), row.State]);
      result.timeline.push([row.DateTimeEnd.getTime() - 1, row.State]);
      if (row.State)
        onminutes += row.Minute;
      allminutes += row.Minute;
    }

    if (allminutes > 0) {
      let m = onminutes % 60;
      let h = Math.floor(onminutes / 60);
      let d = 0;
      if (h >= 48) {
        d = Math.floor(h / 24);
        h = h - d * 24;
      }

      let time = '';
      if (d > 0)
        time += d.toString() + "d ";

      time += h.toString().padStart(1, '0') + "h ";
      time += m.toString().padStart(2, '0') + "m";

      result.time = time;
      result.percent = Math.round(100 * onminutes / allminutes);
    }

    return result;
  },

};

module.exports = DeviceStateSeries;