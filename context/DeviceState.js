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

  ReleaseCode() {
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
  //  .on("tele.humidity", ("humidty", 12) => )

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

  ProcessMqttMessage(topic, message) {
    const name = this._name;
    let topicmatch = false;

    if (topic == `online/${name}`) {
      logger.debug(`[${name}] Online message: ${message}`);

      this.isonline = ["on", "true", "1"].includes(message);
      this.emit('online', this.isonline);
    }
    else if (topicmatch = topic.match(`stat\/${name}\/([0-9a-z_]*)`)) {
      logger.debug(`[${name}] Stat message: ${topic}=${message}`);

      const statname = topicmatch[1];
      this[`stat_${statname}`] = message;

      this.emit('stat', statname, message);
      this.emit(`stat.${statname}`, message);
    }
    else if (topicmatch = topic.match(`event\/${name}\/([0-9a-z_]*)`)) {
      logger.debug(`[${name}] Event message: ${topic}=${message}`);

      const eventname = topicmatch[1];
      this[`event_${eventname}`] = message;

      this.emit('event', eventname, message);
      this.emit(`event.${eventname}`, message);
    }

  }
}

module.exports = DeviceState;