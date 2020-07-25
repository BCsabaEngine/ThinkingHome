const DeviceStatSeriesTable = db.defineTable('DeviceStatSeries', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Device: db.ColTypes.int(11).notNull().index(),
    Stat: db.ColTypes.varchar(100).notNull(),
    DateTimeStart: db.ColTypes.datetime().notNull().defaultCurrentTimestamp().index(),
    DateTimeEnd: db.ColTypes.datetime(),
    Data: db.ColTypes.varchar(512),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
    db.KeyTypes.index('Device', 'Stat', 'DateTimeEnd'),
  ],
});

const DeviceStatSeries = {

  GetByDeviceId(deviceid, stat, days = 1) {
    return db.pquery(`
      SELECT
        dss.Data,
        dss.DateTimeStart,
        COALESCE(dss.DateTimeEnd, NOW()) AS DateTimeEnd,
        TIMESTAMPDIFF(MINUTE, dss.DateTimeStart, COALESCE(dss.DateTimeEnd, NOW())) AS Minute
      FROM DeviceStatSeries dss
      WHERE dss.Device = ? AND
            dss.Stat = ? AND
            (dss.DateTimeStart >= NOW() - INTERVAL ? DAY
             OR
             dss.DateTimeEnd >= NOW() - INTERVAL ? DAY)
      ORDER BY dss.DateTimeStart, dss.Id`, [deviceid, stat, days, days]);
  },

  GetAllByDeviceId(deviceid, days) {
    return db.pquery(`
      SELECT
        dss.Stat,
        dss.Data,
        dss.DateTimeStart,
        COALESCE(dss.DateTimeEnd, NOW()) AS DateTimeEnd
      FROM DeviceStatSeries dss
      WHERE dss.Device = ? AND
            (dss.DateTimeStart >= NOW() - INTERVAL ? DAY
             OR
             dss.DateTimeEnd >= NOW() - INTERVAL ? DAY)
      ORDER BY dss.DateTimeStart, dss.Id`, [deviceid, days, days]);
  },

  NormalizeByStartDate(rows, startdate) {
    rows.forEach(row => {
      if (row.DateTimeStart.getTime() < startdate.getTime())
        row.DateTimeStart = startdate;
    });
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
    rows.forEach(row => {
      result.timeline.push([row.DateTimeStart.getTime(), row.Data == 'on' ? 1 : 0]);
      result.timeline.push([row.DateTimeEnd.getTime() - 1, row.Data == 'on' ? 1 : 0]);
      if (row.Data == 'on')
        onminutes += row.Minute;
      allminutes += row.Minute;
    });

    if (allminutes > 0) {
      const m = onminutes % 60;
      const h = Math.floor(onminutes / 60);
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

module.exports = DeviceStatSeries;