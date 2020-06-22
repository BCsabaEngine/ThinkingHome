const DeviceSysItem = requireRoot('/models/DeviceSysItem');

const DeviceSysTable = db.defineTable('DeviceSys', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    Device: db.ColTypes.int(11).index(),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
  ],
});

const DeviceSys = {
  async InsertJson(device, message) {
    const insertRes = await DeviceSysTable.insert({ Device: device });
    const devicesysid = insertRes.insertId;

    const messagearray = Object.entries(JSON.parse(message));
    for (let i = 0; i < messagearray.length; i++) {
      const key = messagearray[i][0];
      const value = messagearray[i][1];
      if (typeof value === "object") {
        for (let [subkey, subvalue] of Object.entries(value))
          if (typeof subvalue !== "object")
            await DeviceSysItem.Insert(devicesysid, `${key}.${subkey}`, subvalue);
      }
      else
        await DeviceSysItem.Insert(devicesysid, key, value);
    };
  },

  async FindLastByDeviceId(deviceid) {
    const rows = await db.pquery("SELECT * FROM DeviceSys ds WHERE ds.Device = ? ORDER BY ds.Id DESC LIMIT 1", [deviceid]);
    if (rows.length) {
      rows[0].Items = await DeviceSysItem.GetByDeviceSysId(rows[0].Id);
      return rows[0];
    }
    return null;
  },
};

module.exports = DeviceSys;