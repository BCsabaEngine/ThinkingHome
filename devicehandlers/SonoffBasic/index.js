const EventEmitter = require('events');
const logger = requireRoot("/lib/logger");
const config = requireRoot('/lib/config');
const path = require('path');
const pug = require('pug');
const { WSASERVICE_NOT_FOUND } = require('constants');

class SonoffBasic extends EventEmitter {
  LogError(line) { logger.error("[%s/%s] %s", this.constructor.name, this._name, line); }
  LogWarn(line) { logger.warn("[%s/%s] %s", this.constructor.name, this._name, line); }
  LogInfo(line) { logger.info("[%s/%s] %s", this.constructor.name, this._name, line); }
  LogDebug(line) { logger.debug("[%s/%s] %s", this.constructor.name, this._name, line); }

  constructor(id, name, displayname) {
    super();

    this._id = id;
    this._name = name;
    this._displayname = displayname;

    this.isonline = false;

    this.power = false;

    this.InitAppRoutes();

    this.LogInfo("Handler loaded");
  }

  get Id() { return this._id; }
  get Name() { return this._name; }
  get DisplayName() { return this._displayname; }

  get IsOnline() { return this.isonline; }

  get Icon() { return "fa-lightbulb"; }

  InitAppRoutes() {
    app.post(`/${this._name}/power/toggle`, function (req, res) {
      this.power = !this.power;
      res.send("OK");

      wss.BroadcastToChannel("smart32", '');
    }.bind(this));
  }

  ProcessMqttMessage(topic, message) {
    switch (topic) {

      case `stat/${this._name}/online`:
        this.LogDebug(`Processing MQTT message '${message}' on topic '${topic}'`);

        this.isonline = ["on", "true", "1"].includes(message);
        this.emit('onlinechanged', this);
        wss.BroadcastToChannel("smart32", { command: "refresh" });
        break;

      case `stat/${this._name}/power`:
        this.LogDebug(`Processing MQTT message '${message}' on topic '${topic}'`);

        this.power = ["on", "true", "1"].includes(message);
        wss.BroadcastToChannel("smart32", { command: "refresh" });
        //this.emit('onlinechanged', this);
        break;
    }
  }

  GetTilePanelSize() { return 3; }

  GetTilePanelHtml() {
    return pug.compileFile(path.resolve(__dirname, "tile.pug"))
      ({
        IsOnline: this.isonline,
        Name: this._name,
        DisplayName: this._displayname,
        PowerStatus: this.power,
      });
  }
}

module.exports = SonoffBasic;