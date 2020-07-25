const DeviceState = require.main.require('./context/DeviceState');
const OpenWeatherMap = require.main.require('./lib/openWeatherMap');
const PresenceDetector = require.main.require('./lib/presenceDetector');

class Context {
  devices = {};

  InitMqtt(mqttCli) {
    const devices = this.devices;

    mqttCli.on('connect', function () {
      mqttCli.subscribe('#', function (err) { if (err) logger.error("[MQTT: #] Cannot subscribe: %s", err.message); });

      mqttCli.on('message', function (topic, message) {
        message = message.toString();

        const devicenamematch = topic.match(/^[a-z]*\/([0-9a-z_]*)\/?[0-9a-z_]*$/);
        if (!devicenamematch)
          require.main.require("./models/Mqtt").InsertUnknownFormat(topic, message || null);
        else {
          const Device = require.main.require("./models/Device");
          Device.FindByName(devicenamematch[1])
            .then(device => {
              if (device) {
                require.main.require("./models/Mqtt").Insert(device.Id, topic, message || null);

                const eventmatch = topic.match(/^event\/[0-9a-z_]*\/([0-9a-z_]*)$/);
                if (eventmatch)
                  require.main.require("./models/DeviceEvent").Insert(device.Id, eventmatch[1], message || null);

                const telematch = topic.match(/^tele\/[0-9a-z_]*\/([0-9a-z_]*)$/);
                if (telematch)
                  require.main.require("./models/DeviceTele").Insert(device.Id, telematch[1], message || null);

                const statmatch = topic.match(/^stat\/[0-9a-z_]*\/([0-9a-z_]*)$/);
                if (statmatch)
                  require.main.require("./models/DeviceStat").Insert(device.Id, statmatch[1], message || null);

                const logmatch = topic.match(/^log\/[0-9a-z_]*$/);
                if (logmatch)
                  require.main.require("./models/DeviceLog").Insert(device.Id, message || null);

                const sysmatch = topic.match(/^sys\/[0-9a-z_]*$/);
                if (sysmatch)
                  require.main.require("./models/DeviceSys").InsertJson(device.Id, message);

                const capmatch = topic.match(/^cap\/[0-9a-z_]*$/);
                if (capmatch)
                  require.main.require("./models/DeviceCapability").InsertJson(device.Id, message);
              }
              else
                require.main.require("./models/Mqtt").InsertUnknownDevice(devicenamematch[1], topic, message || null);
            });
        }

        logger.debug("[MQTT] Received '" + message + "' on '" + topic + "'");

        for (var key in devices)
          if (topic.match(`^[0-9a-z_]*\/${key}$`) || topic.match(`^[0-9a-z_]*\/${key}\/[0-9a-z_]*$`)) {
            logger.debug("[MQTT] Delegate to device '" + key + "'...");
            devices[key].ProcessMqttMessage(topic, message);
          }
      });

    });
  }

  InitDevices(callback) {
    const Device = require.main.require("./models/Device");
    Device.GetAllPriorityOrder()
      .then(devicerows => {
        devicerows.forEach((devicerow) => {
          try {
            const deviceid = devicerow.Id;
            const deviceState = new DeviceState(deviceid, devicerow.Name, devicerow.DisplayName, devicerow.LocationName, devicerow.FaIcon, devicerow.Color);

            deviceState.on("stat", (a, b) => { wss.BroadcastToChannel(deviceState.Name); });
            deviceState.on("event", (a, b) => { wss.BroadcastToChannel(deviceState.Name); });
            deviceState.on("tele", (a, b) => { wss.BroadcastToChannel(deviceState.Name); });

            // deviceState.on("online", (newstate) => { console.log("OnlineChanged: %s", newstate); });

            this.devices[devicerow.Name] = deviceState;
          }
          catch (ex) {
            logger.error(ex.message);
          }
        });
        callback();
      });
  }

  ReInitDevices() {
    this.InitDevices(async function () {
      if (this.IsRunningContext()) {
        await this.RunContext();
        return Promise.resolve(0);
      }
      else
        return Promise.resolve(0);
    }.bind(this));
  }

  InitWeather() {

    this.weather = new OpenWeatherMap();

    this.weather.on("update", () => { wss.BroadcastToChannel("Weather"); });
  }

  get Weather() {
    return this.weather;
  }

  InitPresenceDetector() {

    this.presencedetector = new PresenceDetector();

    this.presencedetector.on("change", () => { wss.BroadcastToChannel("Presence"); });
  }

  get PresenceDetector() {
    return this.presencedetector;
  }

  GetRunErrorMessage() {
    if (this.runstatus)
      return this.runstatus.message;
    return null;
  }

  GetRunErrorStack() {
    if (this.runstatus)
      return this.runstatus.stack;
    return null;
  }

  IsRunningContext() { return this.runningContext; }

  async RunContext() {
    if (this.runningContext)
      this.runningContext.Stop();

    const RunningContext = require.main.require('./context/RunningContext');

    this.runningContext = new RunningContext();
    this.runstatus = await this.runningContext.Run(this.devices);
  }

  GetDeviceList() {
    const result = [];
    for (var key in this.devices) {
      const device = this.devices[key];
      result.push({ Name: device.Name, DisplayName: device.DisplayName, IsOnline: device.IsOnline, Icon: device.Icon, });
    }
    return result;
  }

}

module.exports = Context;
