const logger = requireRoot("/lib/logger");
const config = requireRoot('/lib/config');
const util = require('util');
const mqttctrl = requireRoot('/controllers/mqtt');
const DeviceState = requireRoot('/context/DeviceState');

class Context {
  devices = {};

  InitMqtt(mqttCli) {
    const devices = this.devices;

    mqttCli.on('connect', function () {
      mqttCli.subscribe('#', function (err) { if (err) logger.error("[MQTT: #] Cannot subscribe: %s", err.message); });

      mqttCli.on('message', function (topic, message) {
        message = message.toString();

        new mqttctrl().StoreMqttAll(topic, message);

        // event/+/+
        if (topic.match(/event\/([0-9a-z-_]*)\/([0-9a-z-_]*)/))
          new mqttctrl().StoreMqttEvent(topic, message);

        // log/+
        if (topic.match(/log\/([0-9a-z-_]*)/))
          new mqttctrl().StoreMqttLog(topic, message);

        // stat/+/sys
        if (topic.match(/stat\/([0-9a-z-_]*)\/sys/))
          new mqttctrl().StoreMqttStatSys(topic, message);

        // stat/+/capability
        if (topic.match(/stat\/([0-9a-z-_]*)\/capability/))
          new mqttctrl().StoreMqttStatCapability(topic, message);

        logger.debug("[MQTT] Received '" + message + "' on '" + topic + "'");

        for (var key in devices)
          if (topic.match(`[0-9a-z-_]*\/${key}\/[0-9a-z-_]*`)) {
            logger.debug("[MQTT] Delegate to device '" + key + "'...");
            devices[key].ProcessMqttMessage(topic, message);
          }
      });

    });
  }

  OnOnlineChanged(device) {
    console.log("OnlineChanged: %s -> %s %s", device.Name, device.IsOnline, device.Power);
  }

  InitDevices(callback) {
    db.query("SELECT * FROM Device d", function (err, devicerows) {
      if (err) throw err;
      db.query("SELECT * FROM DeviceCapability dc", function (err, capabilityrows) {
        if (err) throw err;

        devicerows.forEach((devicerow) => {
          try {
            const deviceid = devicerow.Id;
            const devicecapability = capabilityrows.filter(cap => (cap.Device == deviceid));
            const deviceState = new DeviceState(deviceid, devicerow.Name, devicerow.DisplayName, devicecapability);

            deviceState.on("onlinechanged", this.OnOnlineChanged);

            this.devices[devicerow.Name] = deviceState;
          }
          catch (ex) {
            logger.error(ex.message);
          }
        });
        callback();

      }.bind(this));
    }.bind(this));
  }

  GetDeviceList() {
    const result = [];
    for (var key in this.devices) {
      const device = this.devices[key];
      result.push({ Name: device.Name, DisplayName: device.DisplayName, IsOnline: device.IsOnline, Icon: device.Icon, });
    }
    return result;
  }

  GetDeviceTilePanels() {
    const result = [];
    for (var key in this.devices) {
      const device = this.devices[key];
      result.push({ Size: device.GetTilePanelSize(), Html: device.GetTilePanelHtml(), });
    }
    return result;
  }

}
module.exports = Context;
