const dayjs = require('dayjs');
const MqttDevice = require('../MqttDevice');
const { BoolStateEntity, ButtonEntity } = require('../../Entity');
const { ButtonAction, SelectAction, RangeAction, } = require('../../Action');
const { ToggleBoardItem, PushBoardItem, } = require('../../BoardItem');

class Tasmota extends MqttDevice {
  InitEntities() {
    for (let i = 1; i <= this.setting.powercount; i++)
      this.entities[`power${i}`] = new BoolStateEntity(this, `power${i}`, `Power${i}`, "fa fa-toggle-on")
        .InitStateIcons("fa fa-toggle-off", "fa fa-toggle-on")
        .AddAction(new ButtonAction(this, "toggle", "Toggle", "fa fa-toggle-on", function () { this.device.SendCmnd(`power${i}`, 'toggle'); }))
        .AddAction(new ButtonAction(this, "switchon", "Switch on", "fa fa-toggle-on", function () { this.device.SendCmnd(`power${i}`, 'on'); }))
        .AddAction(new ButtonAction(this, "switchoff", "Switch off", "fa fa-toggle-off", function () { this.device.SendCmnd(`power${i}`, 'off'); }))
        .AddBoardItem(new ToggleBoardItem())
    for (let i = 1; i <= this.setting.buttoncount; i++)
      this.entities[`button${i}`] = new ButtonEntity(this, `button${i}`, `Button${i}`, "fa fa-dot-circle")
        .AddAction(new ButtonAction(this, "push", "Push", "fa fa-dot-circle", function () { this.entity.DoPress(1); }))
    //.AddBoardItem(new PushBoardItem('push'))
    this.LinkUpEntities();
  };

  setting = {
    topic: '',
    powercount: 1,
    buttoncount: 1,
    icon: '',
    toDisplayList: function () {
      const result = {};
      result['topic'] = {
        type: 'text',
        title: `MQTT topic`,
        value: this.setting.topic,
        displayvalue: function () { return this.setting.topic || `${this.name} (default)`; }.bind(this)(),
        error: false,
        canclear: true,
      };
      result["powercount"] = {
        type: 'select',
        title: 'Power count',
        value: this.setting.powercount,
        lookup: JSON.stringify({ 0: "None", 1: 1, 2: 2, 3: 3, 4: 4 }).replace(/["]/g, "\'"),
        error: false,
        canclear: false,
      };
      result["buttoncount"] = {
        type: 'select',
        title: 'Button count',
        value: this.setting.buttoncount,
        lookup: JSON.stringify({ 0: "None", 1: 1, 2: 2 }).replace(/["]/g, "\'"),
        error: false,
        canclear: false,
      };
      result["icon"] = {
        type: 'text',
        title: 'Device icon',
        value: this.setting.icon,
        displayvalue: function () { return this.setting.icon || `fa fa-sliders-h (default)`; }.bind(this)(),
        error: false,
        canclear: true,
      };
      return result;
    }.bind(this),
    toTitle: function () { return this.constructor.name; }.bind(this),
    toSubTitle: function () {
      const result = [];
      if (this.setting.powercount > 0)
        result.push(`${this.setting.powercount}pow`);
      if (this.setting.buttoncount > 0)
        result.push(`${this.setting.buttoncount}btn`);
      return result.join('+');
    }.bind(this),
  };
  //icon = "fa fa-sliders-h";
  get icon() { return this.setting.icon || "fa fa-sliders-h"; }
  entities = {};
  starttime = new Date().getTime();
  tasmota_Time = '';
  tasmota_Module = '';
  tasmota_RestartReason = '';
  tasmota_Uptime = '';
  tasmota_BootCount = 0;
  tasmota_Version = '';
  tasmota_IPAddress = '';
  tasmota_MqttCount = 0;
  tasmota_Wifi_SSId = '';
  tasmota_Wifi_RSSI = 0;
  tasmota_Wifi_LinkCount = 0;
  GetStatusInfos() {
    const result = [];
    if (!this.tasmota_Time && (new Date().getTime() - this.starttime) > 10 * 1000)
      result.push({ device: this, error: true, message: 'No info, maybe offline? ' });
    if (this.tasmota_Time)
      result.push({ device: this, message: 'Info time', value: this.tasmota_Time ? dayjs(this.tasmota_Time).fromNow() : "" });
    if (this.tasmota_Version)
      result.push({ device: this, message: 'Version', value: this.tasmota_Version });
    if (this.tasmota_Module)
      result.push({ device: this, message: 'Module', value: this.tasmota_Module });
    if (this.tasmota_RestartReason)
      result.push({ device: this, message: 'Start reason', value: this.tasmota_RestartReason });
    if (this.tasmota_Uptime)
      result.push({ device: this, message: 'Uptime', value: this.tasmota_Uptime });
    if (this.tasmota_BootCount)
      result.push({ device: this, message: 'Boot count', value: this.tasmota_BootCount });
    if (this.tasmota_IPAddress)
      result.push({ device: this, message: 'Wifi IP', value: this.tasmota_IPAddress });
    if (this.tasmota_Wifi_SSId)
      result.push({ device: this, message: 'Wifi SSID', value: this.tasmota_Wifi_SSId });
    if (this.tasmota_Wifi_RSSI)
      result.push({ device: this, message: 'Wifi RSSI', value: this.tasmota_Wifi_RSSI });
    if (this.tasmota_Wifi_LinkCount)
      result.push({ device: this, message: 'Wifi link count', value: this.tasmota_Wifi_LinkCount });
    if (this.tasmota_MqttCount)
      result.push({ device: this, message: 'Mqtt link count', value: this.tasmota_MqttCount });
    return result;
  }
  async Start() {
    await super.Start();
    this.InitEntities();
    this.SendCmnd('STATUS', "0");
    for (let i = 1; i <= this.setting.powercount; i++)
      this.SendCmnd(`POWER${i}`);
  }
  GetTopic() {
    return (this.setting.topic || this.name).toLowerCase();
  }
  SendCmnd(command, message) {
    const topic = `cmnd/${this.GetTopic()}/${command}`;
    // console.log([topic, message]);
    this.platform.SendMessage(topic, message);
  }
  ProcessMessage(topic, message) {
    for (let i = 1; i <= this.setting.powercount; i++)
      if (topic.match(`^stat\/${this.GetTopic()}\/POWER${i}$`) || i == 1 && topic.match(`^stat\/${this.GetTopic()}\/POWER$`)) {
        this.entities[`power${i}`].SetState(message.toLowerCase() == "ON".toLowerCase() ? 1 : 0);
        return true;
      }

    if (topic.match(`^stat\/${this.GetTopic()}\/RESULT$`)) {
      logger.debug(`[Tasmota] Result message on ${topic}: ${message}`);
      return true;
    }

    return false;
  }
  ProcessMessageObj(topic, messageobj) {
    for (let i = 1; i <= this.setting.buttoncount; i++)
      if (topic.match(`^stat\/${this.GetTopic()}\/BUTTON${i}$`)) {
        const buttonevent = messageobj.ACTION.toLowerCase();
        switch (buttonevent) {
          case "SINGLE".toLowerCase():
            this.entities.button1.DoPress(1);
            return true;
          case "DOUBLE".toLowerCase():
            this.entities.button1.DoPress(2);
            return true;
          case "TRIPLE".toLowerCase():
            this.entities.button1.DoPress(3);
            return true;
          case "HOLD".toLowerCase():
            this.entities.button1.DoPress(-1);
            return true;
        }
      }

    if (topic.match(`^stat\/${this.GetTopic()}\/RESULT$`)) {
      const message = Object.keys(messageobj).map((key) => key + "=" + messageobj[key]);
      logger.debug(`[Tasmota] Result message on ${topic}: ${message}`);
      return true;
    }

    if (topic.match(`^stat\/${this.GetTopic()}\/STATUS([0-9]*)$`))
      if (Object.keys(messageobj).length == 1) {

        const statustype = Object.keys(messageobj)[0];
        const statusobj = messageobj[statustype];
        switch (statustype) {

          case "Status":
            this.tasmota_Module = statusobj.Module;
            break;

          case "StatusPRM":
            this.tasmota_RestartReason = statusobj.RestartReason;
            this.tasmota_Uptime = statusobj.Uptime;
            this.tasmota_BootCount = statusobj.BootCount;
            break;

          case "StatusFWR":
            this.tasmota_Version = statusobj.Version;
            break;

          case "StatusNET":
            this.tasmota_IPAddress = statusobj.IPAddress;
            break;

          case "StatusMQT":
            this.tasmota_MqttCount = statusobj.MqttCount;
            break;

          case "StatusSTS":
            this.tasmota_Wifi_SSId = statusobj.Wifi.SSId;
            this.tasmota_Wifi_RSSI = statusobj.Wifi.RSSI;
            this.tasmota_Wifi_LinkCount = statusobj.Wifi.LinkCount;
            break;

        }
        this.tasmota_Time = new Date().getTime();
        return true;
      }

    if (topic.match(`^tele\/${this.GetTopic()}\/STATE$`)) {
      this.tasmota_Uptime = messageobj.Uptime;
      this.tasmota_MqttCount = messageobj.MqttCount;
      this.tasmota_Wifi_SSId = messageobj.Wifi.SSId;
      this.tasmota_Wifi_RSSI = messageobj.Wifi.RSSI;
      this.tasmota_Wifi_LinkCount = messageobj.Wifi.LinkCount;

      this.tasmota_Time = new Date().getTime();
      return true;
    }

    if (topic.match(`^tele\/${this.GetTopic()}\/INFO1$`)) {
      this.tasmota_Module = messageobj.Module;
      this.tasmota_Version = messageobj.Version;
      return true;
    }

    if (topic.match(`^tele\/${this.GetTopic()}\/INFO2$`)) {
      this.tasmota_IPAddress = messageobj.IPAddress;
      return true;
    }

    if (topic.match(`^tele\/${this.GetTopic()}\/INFO3$`)) {
      this.tasmota_RestartReason = messageobj.RestartReason;
      return true;
    }

    //    if (topic.match(`^stat\/${this.GetTopic()}\/([a-zA-Z0-9]*)$`))
    //      return true;

    return false;
  }
}
module.exports = Tasmota;