const logger = requireRoot("/lib/logger");

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
    const devicenamematch = topic.match(/[a-z]*\/([0-9a-z_]*)\/?[a-z]*/);
    if (!devicenamematch)
      db.query("INSERT INTO Mqtt (Device, Topic, Payload) VALUES (?, ?, ?)", [null, topic, message || null]);
    else {
      const devicename = devicenamematch[1];
      this.FindOrCreateDevice(devicename, function (deviceid) {
        db.query("INSERT INTO Mqtt (Device, Topic, Payload) VALUES (?, ?, ?)", [deviceid, topic, message || null]);
      });
    }
  }

  StoreMqttEvent(topic, message) {
    const devicenameeventmatch = topic.match(/event\/([0-9a-z_]*)\/([0-9a-z_]*)/);
    if (!devicenameeventmatch)
      return;

    const devicename = devicenameeventmatch[1];
    const eventname = devicenameeventmatch[2];
    this.FindOrCreateDevice(devicename, function (deviceid) {
      db.query("INSERT INTO DeviceEvent (Device, Event, Data) VALUES (?, ?, ?)", [deviceid, eventname, message || null]);
    });
  }

  StoreMqttLog(topic, message) {
    const devicenamematch = topic.match(/log\/([0-9a-z_]*)/);
    if (!devicenamematch)
      return;

    const devicename = devicenamematch[1];
    this.FindOrCreateDevice(devicename, function (deviceid) {
      db.query("INSERT INTO DeviceLog (Device, Message) VALUES (?, ?)", [deviceid, message || null]);
    });
  }

  StoreMqttStatSys(topic, message) {
    const devicenamematch = topic.match(/sys\/([0-9a-z_]*)/);
    if (!devicenamematch)
      return;

    const devicename = devicenamematch[1];
    this.FindOrCreateDevice(devicename, function (deviceid) {
      db.query("INSERT INTO DeviceSys (Device) VALUES (?)", [deviceid], function (err, result) {
        const devicesysid = result.insertId;

        try {
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
        }
        catch (ex) {
          logger.error("[MQQT StoreMqttStatSys] %s", ex.message);
        }

      });
    });
  }

  StoreMqttStatCapability(topic, message) {
    const devicenamematch = topic.match(/cap\/([0-9a-z_]*)/);
    if (!devicenamematch)
      return;

    const devicename = devicenamematch[1];
    this.FindOrCreateDevice(devicename, function (deviceid) {
      db.query("DELETE FROM DeviceCapability WHERE Device = ?", [deviceid], function (err, result) {

        try {
          const messagearray = Object.entries(JSON.parse(message));
          messagearray.forEach((element) => {
            const key = element[0];
            const value = element[1];

            let rows = [];
            if (Array.isArray(value))
              value.forEach((subvalue) => {
                let valuestr = `${key}/[$]`;
                if (subvalue)
                  if (subvalue.startsWith(":"))
                    valuestr = `${key}/[$]${subvalue}`;
                  else
                    valuestr = `${key}/[$]/${subvalue}`;
                rows.push([deviceid, valuestr]);
              });
            db.query("INSERT IGNORE INTO DeviceCapability (Device, Value) VALUES ?", [rows]);
          });
        }
        catch (ex) {
          logger.error("[MQQT StoreMqttStatCapability] %s", ex.message);
        }

      });
    });
  }

}
module.exports = MqttController;