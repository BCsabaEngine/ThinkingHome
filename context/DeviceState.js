const EventEmitter = require('events');
const logger = requireRoot("/lib/logger");
const config = requireRoot('/lib/config');
const path = require('path');

class DeviceState extends EventEmitter {
  constructor(id, name, displayname, capabilities) {
    super();

    this._id = id;
    this._name = name;
    this._displayname = displayname;
    this.isonline = false;

    this.InitByCapabilities(capabilities);
  }

  InitByCapabilities(capabilities) {
    capabilities.forEach((capability) => {
      
      const cmdmatch = capability.Value.match(/^cmd\/\[\$\]\/([0-9a-z-_]*)$/);
      if (cmdmatch) {
        const cmdvalue = cmdmatch[1];
        if (!["restart"].includes(cmdvalue)) {

          console.log(cmdvalue);

        }
      }
      
      const cmdexmatch = capability.Value.match(/^cmd\/\[\$\]\/([0-9a-z-_]*):([0-9a-z-/_]*)$/);
      if (cmdexmatch) {
        const cmdvalue = cmdexmatch[1];
        if (!["restart"].includes(cmdvalue)) {

          const options = cmdexmatch[2].split("/");
          console.log(cmdvalue + options);

        }
      }

      
    });
  }

  get Id() { return this._id; }
  get Name() { return this._name; }
  get DisplayName() { return this._displayname || this._name; }
  get IsOnline() { return this.isonline; }

  get Power() { return this.isonline; }


  //  power1("on")
  //  power1("off")
  //  power1("toggle")
  //  power2("toggle")
  //  getpower1() //by statpower
  //  getpower2() //by statpower
  //  gettele("humidity")
  //  gettele10avg("humidity")
  //  ack("high")
  //  ack("start")

  //  .on("power1", ("on") => )
  //  .on("button", ("short") => )
  //  .on("move", ("on") => )
  //  .on("tele", ("humidty", 12) => )



  ProcessMqttMessage(topic, message) {
    switch (topic) {

      case `stat/${this._name}/online`:
        this.isonline = ["on", "true", "1"].includes(message);
        this.emit('onlinechanged', this);
        break;

      case `stat/${this._name}/power`:
        this.power = ["on", "true", "1"].includes(message);
        break;

      case `event/${this._name}/button`:
        this.power = ["on", "true", "1"].includes(message);
        break;

    }

  }
}

module.exports = DeviceState;