const moment = require('moment');

const DeviceSysItemTable = db.defineTable('DeviceSysItem', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DeviceSys: db.ColTypes.int(11).notNull().index(),
    Name: db.ColTypes.varchar(100).notNull(),
    Value: db.ColTypes.varchar(100).notNull(),
  },
  keys: [
    db.KeyTypes.foreignKey('DeviceSys').references('DeviceSys', 'Id').cascade(),
  ],
});

const DeviceSysItem = {
  async Insert(devicesys, name, value) {
    await DeviceSysItemTable.insert({ DeviceSys: devicesys, Name: name, Value: value });
  },

  async GetByDeviceSysId(devicesysid) {
    const rows = await DeviceSysItemTable.select(['Name', 'Value'], 'WHERE DeviceSys = ? ORDER BY Name', [devicesysid]);

    rows.forEach(row => {
      switch (row.Name) {

        case "chipid":
          row.Name = "Chip ID";
          break;

        case "uptime":
          row.Name = "Uptime";
          row.Value = moment(moment.now() - 1000 * row.Value).fromNow();
          break;

        case "wifi.ip":
          row.Name = "Local IP";
          if (row.Value)
            row.ValueLink = `//${row.Value}/`;
          break;

        case "wifi.rssi":
          row.Name = "Wifi signal";
          row.SubValue = ` (${row.Value}dBm)`;
          if (row.Value > -60)
            row.Value = "Excellent";
          else if (row.Value > -70)
            row.Value = "Good";
          else if (row.Value > -80)
            row.Value = "Fair";
          else
            row.Value = "Poor";
          break;

        case "wifi.ssid":
          row.Name = "Netwok name";
          break;
      }
    })

    return rows;
  },
};

module.exports = DeviceSysItem;