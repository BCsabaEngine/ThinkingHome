const EventEmitter = require('events');

class DeviceState extends EventEmitter {
  constructor(id, name, displayname, locationname, faicon, color) {
    super();

    this._id = id;
    this._name = name;
    this._displayname = displayname;
    this._locationname = locationname;
    this._faicon = faicon;
    this._color = color;
    this.isonline = false;
    this.nextop = {};
  }

  get Id() { return this._id; }
  get Name() { return this._name; }
  get DisplayName() { return this._displayname || this._name; }
  get LocationName() { return this._locationname; }
  get Icon() { return this._faicon || "fa-globe"; }
  get Color() { return this._color; }

  get IsOnline() { return this.isonline; }

  GetNextOp(component) { return this.nextop[component + '_' + this.stat(component)]; }
  UpdateNextOp(component, stat, description) { this.nextop[component + '_' + stat] = description; }

  ReleaseListeners() { this.removeAllListeners(); }


  //  cmd("power1", "on")
  //  stat("power1")
  //  tele("humidity")
  //  ack("high")
  //  ack("start")

  //  .on("online", ("on") => )

  //  .on("stat.power", ("on") => )
  //  .on("stat", ("power", "on") => )

  //  .on("event", ("button", "short") => )
  //  .on("event.button1", ("short") => )
  //  .on("event.move", ("on") => )

  //  .on("tele", ("humidty", 12) => )
  //  .on("tele.humidity", (12) => )

  cmd(command, message) {
    const name = this._name;
    mqtt.publish(`cmd/${name}/${command}`, message, { retain: true });
  }

  stat(statname) {
    return this[`stat_${statname}`];
  }

  ack(ackname) {
    const name = this._name;
    mqtt.publish(`ack/${name}`, ackname);
  }

  tele(telename) {
    return this[`tele_${telename}`];
  }
  teleAvg(telename) {
    if (this[`teleavg_${telename}`] === undefined)
      return 0;
    if (!this[`teleavg_${telename}`].length)
      return 0;
    return this[`teleavg_${telename}`].reduce((acc, curr) => acc + curr) / this[`teleavg_${telename}`].length;
  }
  addTeleAvg(telename, value) {
    if (this[`teleavg_${telename}`] === undefined)
      this[`teleavg_${telename}`] = [];

    this[`teleavg_${telename}`].push(value);
    while (this[`teleavg_${telename}`].length > 30)
      this[`teleavg_${telename}`].shift();
  }

  metric(telename) {
    telename = (telename || "").toLowerCase();

    if (telename.startsWith("temp"))
      return "°C";

    if (telename.startsWith("lumi"))
      return "lx";

    if (telename.startsWith("current"))
      return "A";

    if (telename.startsWith("volt"))
      return "V";

    if (telename.startsWith("power"))
      return "W";

    return "";
  }

  SendTimeAndConfig() {
    const name = this._name;

    const DeviceConfig = require.main.require('./models/DeviceConfig');
    DeviceConfig.GetAllByDeviceId(this._id)
      .then(deviceconfigs => {
        const now = new Date();
        const timevalue = Math.round(now.getTime() / 1000) - now.getTimezoneOffset() * 60;

        const items = [];
        items.push({ name: `cfg/${name}/time`, value: timevalue.toString() });
        items.push({ name: `cfg/${name}/reset`, value: '' });
        if (deviceconfigs && deviceconfigs.length) {
          deviceconfigs.forEach(deviceconfig => {
            items.push({ name: `cfg/${name}/set`, value: JSON.stringify({ name: deviceconfig.Name, value: deviceconfig.Value }) });
          });
          items.push({ name: `cfg/${name}/commit`, value: '' });
        }

        const MQTTDELAY_INIT = Math.floor(Math.random() * 1000);
        const MQTTDELAY_STEP = Math.floor(Math.random() * 1000);
        let index = 1;
        items.forEach(item => {
          const cfg_name = item.name;
          const cfg_value = item.value;

          setTimeout(() => { mqtt.publish(cfg_name, cfg_value); }, MQTTDELAY_INIT + index * MQTTDELAY_STEP);

          index++;
        });
      });
  }

  ProcessMqttMessage(topic, message) {
    const name = this._name;
    let topicmatch = false;

    if (topic == `online/${name}`) {
      logger.debug(`[${name}] Online message: ${message}`);

      this.isonline = ["on", "true", "1"].includes(message);
      this.emit('online', this.isonline);

      this.SendTimeAndConfig();

      clearInterval(this.config_timer);
      this.config_timer = setInterval(() => { this.SendTimeAndConfig(); }, 60 * 60 * 1000);
    }
    else if (topicmatch = topic.match(`^stat\/${name}\/([0-9a-z_]*)$`)) {
      logger.debug(`[${name}] Stat message: ${topic}=${message}`);

      const statname = topicmatch[1];

      this[`stat_${statname}`] = message;

      this.emit('stat', statname, message);
      this.emit(`stat.${statname}`, message);
    }
    else if (topicmatch = topic.match(`^event\/${name}\/([0-9a-z_]*)$`)) {
      logger.debug(`[${name}] Event message: ${topic}=${message}`);

      const eventname = topicmatch[1];

      this[`event_${eventname}`] = message;

      this.emit('event', eventname, message);
      this.emit(`event.${eventname}`, message);
    }
    else if (topicmatch = topic.match(`^tele\/${name}\/([0-9a-z_]*)$`)) {
      logger.debug(`[${name}] Tele message: ${topic}=${message}`);

      const telename = topicmatch[1];

      let value = Number(message);
      const DeviceTeleScale = require.main.require('./models/DeviceTeleScale');
      DeviceTeleScale.FindByDeviceTelemetry(this._id, telename)
        .then(scales => {
          if (scales) {
            const oldvalue = value;
            value = scales.Calc(value);
            logger.debug(`[${name}] Scaled telemetry ${telename} from ${oldvalue} to ${value}`);
          }

          this[`tele_${telename}`] = value;

          this.addTeleAvg(telename, value);

          this.emit('tele', telename, value);
          this.emit(`tele.${telename}`, value);
        });
    }

  }
}

module.exports = DeviceState;