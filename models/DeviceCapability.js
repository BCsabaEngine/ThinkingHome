const DeviceCapabilityTable = db.defineTable('DeviceCapability', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    Device: db.ColTypes.int(11).index(),
    Value: db.ColTypes.varchar(100).notNull(),
  },
  keys: [
    db.KeyTypes.foreignKey('Device').references('Device', 'Id').cascade(),
  ],
});

const DeviceCapability = {
  async GetByDeviceId(deviceid) {
    const rows = await DeviceCapabilityTable.select(['Value'], 'WHERE Device = ? ORDER BY Id', [deviceid]);
    rows.forEach(row => {
      if (row.Value.includes(":")) {
        const parts = row.Value.split(":");
        row.Value = parts[0];
        row.Items = parts[1].split("/");
      }
    });
    return rows;
  },

  GetCapabilityComponentByStatAndCmd(devicecapabilities) {

    let devicecomponents = {};

    if (devicecapabilities)
      devicecapabilities.forEach(devicecapability => {
        const devicecapabilityvalue = devicecapability.Value;
        const devicecapmatch = devicecapabilityvalue.match(/stat\/\[\$\]\/?([a-z0-9]*)$/);
        if (devicecapmatch) {
          const componentname = devicecapmatch[1];
          devicecomponents[componentname] = [];
        }
      });

    if (devicecapabilities)
      devicecapabilities.forEach(devicecapability => {
        const devicecapabilityvalue = devicecapability.Value;
        const devicecapmatch = devicecapabilityvalue.match(/cmd\/\[\$\]\/?([a-z0-9]*)$/);
        if (devicecapmatch) {
          const componentname = devicecapmatch[1];
          devicecomponents[componentname] = [];

          if (devicecapability.Items)
            devicecapability.Items.forEach(capitem => {
              devicecomponents[componentname].push(capitem);
            })
        }
      });

    return devicecomponents;
  },

};

module.exports = DeviceCapability;