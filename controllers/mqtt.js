class MqttController {
  constructor() { }

  FindOrCreateDevice(devicename, storefunc) {
    db.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query("INSERT IGNORE INTO Device (Name) VALUES (?)", [devicename], function () {
        connection.query("SELECT d.Id FROM Device d WHERE d.Name = ?", [devicename], function (err, rows) {
          connection.release();
          if (rows && rows.length > 0) {
            const deviceid = rows[0].Id;
            storefunc(deviceid);
          }
        });
      });
    });
  }

  StoreMqttAll(topic, message) {
    const devicenamematch = topic.match(/[a-z]*\/([0-9a-z-_]*)\/?[a-z]*/);
    if (!devicenamematch)
      db.query("INSERT INTO Mqqt (Device, Topic, Payload) VALUES (?, ?, ?)", [null, topic, message || null]);
    else {
      const devicename = devicenamematch[1];
      this.FindOrCreateDevice(devicename, function (deviceid) {
        db.query("INSERT INTO Mqqt (Device, Topic, Payload) VALUES (?, ?, ?)", [deviceid, topic, message || null]);
      });
    }
  }

  StoreMqttLog(topic, message) {
    const devicenamematch = topic.match(/log\/([0-9a-z-_]*)/);
    if (!devicenamematch)
      return;

    const devicename = devicenamematch[1];
    this.FindOrCreateDevice(devicename, function (deviceid) {
      db.query("INSERT INTO DeviceLog (Device, Message) VALUES (?, ?)", [deviceid, message || null]);
    });
  }

  StoreMqttStatSys(topic, message) {
    const devicenamematch = topic.match(/stat\/([0-9a-z-_]*)\/sys/);
    if (!devicenamematch)
      return;

    const devicename = devicenamematch[1];
    this.FindOrCreateDevice(devicename, function (deviceid) {
      db.query("INSERT INTO DeviceSys (Device) VALUES (?)", [deviceid], function (err, result) {
        const devicesysid = result.insertId;

        const messagearray = Object.entries(JSON.parse(message));
        messagearray.forEach((element) => {
          const key = element[0];
          const value = element[1];
          if (typeof value === "object") {
            for (let [subkey, subvalue] of Object.entries(value))
              if (typeof subvalue !== "object")
                db.query("INSERT INTO DeviceSysItem (DeviceSys, Name, Value) VALUES (?, ?, ?)", [devicesysid, `${key}.${subkey}`, subvalue]);
          }
          else
            db.query("INSERT INTO DeviceSysItem (DeviceSys, Name, Value) VALUES (?, ?, ?)", [devicesysid, key, value]);
        });

      });
    });
  }

  StoreMqttStatCapability(topic, message) {
    const devicenamematch = topic.match(/stat\/([0-9a-z-_]*)\/capability/);
    if (!devicenamematch)
      return;

    const devicename = devicenamematch[1];
    this.FindOrCreateDevice(devicename, function (deviceid) {
      db.query("DELETE FROM DeviceCapability WHERE Device = ?", [deviceid], function (err, result) {

        const messagearray = Object.entries(JSON.parse(message));
        messagearray.forEach((element) => {
          const key = element[0];
          const value = element[1];

          let rows = [];
          if (Array.isArray(value))
            value.forEach((subvalue) => {
              const valuestr = subvalue ? `${key}/[$]/${subvalue}` : `${key}/[$]`;
              rows.push([deviceid, valuestr]);
            });
          db.query("INSERT IGNORE INTO DeviceCapability (Device, Value) VALUES ?", [rows]);
        });

      });
    });
  }

}
module.exports = MqttController;