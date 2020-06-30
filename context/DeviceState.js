const EventEmitter = require('events');
const logger = requireRoot("/lib/logger");

class DeviceState extends EventEmitter {
  constructor(id, name, displayname, faicon) {
    super();

    this._id = id;
    this._name = name;
    this._displayname = displayname;
    this._faicon = faicon;
    this.isonline = false;
  }

  get Id() { return this._id; }
  get Name() { return this._name; }
  get DisplayName() { return this._displayname || this._name; }
  get Icon() { return this._faicon || "fa-globe" }
  get IsOnline() { return this.isonline; }

  ReleaseListeners() {
    this.removeAllListeners();
  }


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

  async ProcessMqttMessage(topic, message) {
    const name = this._name;
    let topicmatch = false;

    if (topic == `online/${name}`) {
      logger.debug(`[${name}] Online message: ${message}`);

      this.isonline = ["on", "true", "1"].includes(message);
      this.emit('online', this.isonline);
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
      const DeviceTeleScale = requireRoot('/models/DeviceTeleScale');
      const scales = await DeviceTeleScale.FindByDeviceTelemetry(this._id, telename);
      if (scales) {
        const oldvalue = value;
        value = scales.Calc(value);
        logger.debug(`[${name}] Scaled telemetry ${telename} from ${oldvalue} to ${value}`);
      }

      this[`tele_${telename}`] = value;

      this.addTeleAvg(telename, value);

      this.emit('tele', telename, value);
      this.emit(`tele.${telename}`, value);
    }

  }
}

module.exports = DeviceState;