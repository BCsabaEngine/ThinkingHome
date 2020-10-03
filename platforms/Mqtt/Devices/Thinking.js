const dayjs = require('dayjs');
const timeUtils = require('../../../lib/timeUtils');
const stringUtils = require('../../../lib/stringUtils');
const MqttDevice = require('../MqttDevice');
const { BoolStateEntity, ButtonEntity } = require('../../Entity');
const { ButtonAction, SelectAction, RangeAction, } = require('../../Action');
const { ToggleBoardItem, PushBoardItem, } = require('../../BoardItem');

class Thinking extends MqttDevice {
  get icon() { return "fa fa-code-branch"; }
  entities = {};
  starttime = new Date().getTime();
  thinking_Time = '';
  thinking_ChipID = '';
  thinking_Firmware = '';
  thinking_Uptime = '';
  thinking_Freemem = '';
  thinking_IPAddress = '';
  thinking_Wifi_SSId = '';
  thinking_Wifi_RSSI = 0;
  GetStatusInfos() {
    const result = [];
    if (!this.thinking_Time && (new Date().getTime() - this.starttime) > 10 * 1000 || this.thinking_Time && (new Date().getTime() - this.thinking_Time) > 30 * 60 * 1000)
      result.push({ device: this, error: true, message: 'No info, maybe offline? ' });
    if (this.thinking_Time)
      result.push({ device: this, message: 'Info time', value: this.thinking_Time ? dayjs(this.thinking_Time).fromNow() : "" });
    if (this.thinking_ChipID)
      result.push({ device: this, message: 'Chip IP', value: this.thinking_ChipID });
    if (this.thinking_Firmware)
      result.push({ device: this, message: 'Firmware', value: this.thinking_Firmware });
    if (this.thinking_Uptime)
      result.push({ device: this, message: 'Uptime', value: timeUtils.secondsToTime(this.thinking_Uptime) });
    if (this.thinking_Freemem)
      result.push({ device: this, message: 'Freemem', value: stringUtils.thousand(this.thinking_Freemem) + ' bytes' });
    if (this.thinking_IPAddress)
      result.push({ device: this, message: 'Wifi IP', value: this.thinking_IPAddress });
    if (this.thinking_Wifi_SSId)
      result.push({ device: this, message: 'Wifi SSID', value: this.thinking_Wifi_SSId });
    if (this.thinking_Wifi_RSSI)
      result.push({ device: this, message: 'Wifi RSSI', value: this.thinking_Wifi_RSSI });
    return result;
  }
  async Start() {
    await super.Start();
    this.platform.SendMessage(`ping/${this.GetTopic()}`, '');
  }
  thinking_configlasttime = 0;
  CollectConfigToSend() { return []; }
  SendConfig() {
    const now = new Date();
    const timevalue = Math.round(now.getTime() / 1000) - now.getTimezoneOffset() * 60;

    const items = [];
    items.push({ topic: `cfg/${this.GetTopic()}/time`, message: timevalue.toString() });
    items.push({ topic: `cfg/${this.GetTopic()}/reset`, message: '' });
    const configtosend = this.CollectConfigToSend();
    if (configtosend && configtosend.length) {
      for (const cts of configtosend)
        if (cts.name)
          items.push({ topic: `cfg/${this.GetTopic()}/set`, message: JSON.stringify({ name: cts.name, value: cts.value }) });
      items.push({ topic: `cfg/${this.GetTopic()}/commit`, message: '' });
    }

    const MQTTDELAY_INIT = Math.floor(Math.random() * 1000);
    const MQTTDELAY_STEP = Math.floor(Math.random() * 1000);
    let index = 1;
    for (const item of items) {
      const cfg_name = item.topic;
      const cfg_value = item.message;
      setTimeout(function () {
        this.platform.SendMessage(item.topic, item.message);
        logger.debug(`[Thinking] Config message sent to ${item.topic}: ${item.message}`);
      }.bind(this), MQTTDELAY_INIT + index * MQTTDELAY_STEP);
      index++;
    };
    
    this.thinking_configlasttime = now.getTime();
    
    wss.BroadcastToChannel(`device_${this.name}`);
  }
  GetTopic() { return (this.name).toLowerCase(); }
  SendMqtt(prefix, postfix, message) {
    if (prefix)
      if (postfix)
        this.platform.SendMessage(`${prefix}/${this.GetTopic()}/${postfix}`, message);
      else
        this.platform.SendMessage(`${prefix}/${this.GetTopic()}`, message);
  }
  SendCmd(command, message) {
    this.SendMqtt('cmd', command, message);
  }
  ProcessMessage(topic, message) {
    if (topic.match(`^online\/${this.GetTopic()}$`)) {
      this.SendConfig();
      return true;
    }
    if (topic.match(`^cfg\/${this.GetTopic()}\/(time|set|reset|commit)`))
      return true;

    return false;
  }
  ProcessMessageObj(topic, messageobj) {
    if (topic.match(`^sys\/${this.GetTopic()}$`)) {
      this.thinking_ChipID = messageobj.chipid;
      this.thinking_Version = messageobj.firmware;
      this.thinking_Uptime = messageobj.uptime;
      this.thinking_Freemem = messageobj.freemem;
      this.thinking_IPAddress = messageobj.wifi.ip;
      this.thinking_Wifi_SSId = messageobj.wifi.ssid;
      this.thinking_Wifi_RSSI = messageobj.wifi.rssi;

      this.thinking_Time = new Date().getTime();
      this.SendConfig();
      return true;
    }
    if (topic.match(`^cfg\/${this.GetTopic()}\/(time|set|reset|commit)`))
      return true;

    return false;
  }
}
module.exports = Thinking;