const logger = requireRoot("/lib/logger");
const config = requireRoot('/lib/config');
const util = require('util');
const mqttctrl = requireRoot('/controllers/mqtt');
const DeviceState = requireRoot('/context/DeviceState');
const RunningContext = requireRoot('/context/RunningContext');

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
        if (topic.match(/event\/([0-9a-z_]*)\/([0-9a-z_]*)/))
          new mqttctrl().StoreMqttEvent(topic, message);

        // log/+
        if (topic.match(/log\/([0-9a-z_]*)/))
          new mqttctrl().StoreMqttLog(topic, message);

        // sys/+
        if (topic.match(/sys\/([0-9a-z_]*)/))
          new mqttctrl().StoreMqttStatSys(topic, message);

        // cap/+
        if (topic.match(/cap\/([0-9a-z_]*)/))
          new mqttctrl().StoreMqttStatCapability(topic, message);

        logger.debug("[MQTT] Received '" + message + "' on '" + topic + "'");

        for (var key in devices)
          if (topic.match(`[0-9a-z_]*\/${key}`) || topic.match(`[0-9a-z_]*\/${key}\/[0-9a-z_]*`)) {
            logger.debug("[MQTT] Delegate to device '" + key + "'...");
            devices[key].ProcessMqttMessage(topic, message);
          }
      });

    });
  }

  InitDevices(callback) {
    db.query("SELECT * FROM Device d ORDER BY d.Priority, d.Name", function (err, devicerows) {
      if (err) throw err;

      devicerows.forEach((devicerow) => {
        try {
          const deviceid = devicerow.Id;
          const deviceState = new DeviceState(deviceid, devicerow.Name, devicerow.DisplayName, devicerow.FaIcon);

          // deviceState.on("online", (newstate) => { console.log("OnlineChanged: %s", newstate); });
          // deviceState.on("stat", (a, b) => { console.log("stat: %s %s", a, b); });
          // deviceState.on("stat.power", (a) => { console.log("stat.power: %s", a); });

          // deviceState.on("event", (a, b) => { console.log("event: %s %s", a, b); });
          // deviceState.on("event.button", (a) => { console.log("event.button: %s", a); });

          this.devices[devicerow.Name] = deviceState;
        }
        catch (ex) {
          logger.error(ex.message);
        }
      });
      callback();

    }.bind(this));
  }

  RunContext() {
    const runningContext = new RunningContext();

    runningContext.Run(this.devices);
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
