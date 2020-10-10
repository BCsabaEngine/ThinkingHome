const Device = require('../Device');

class MqttDevice extends Device {
  static GetTypes() {
    return {
      'ThSonoffRF': { displayname: 'Thinking Sonoff RF', devicename: 'thinking_'.toLowerCase(), icon: 'fa fa-broadcast-tower' },
      'ThBlitzwolfIR': { displayname: 'Thinking BW-RC1', devicename: 'thinking_'.toLowerCase(), icon: 'fa fa-rss' },
      'Tasmota': { displayname: 'Tasmota', devicename: 'Tasmota_'.toLowerCase(), icon: 'fa fa-sliders-h' },
    }
  }
  static CreateByType(type, id, platform, name) {
    try {
      const typeclass = require('./Devices/' + type);
      return new typeclass(id, platform, name);
    }
    catch (err) {
      if (err.code == 'MODULE_NOT_FOUND')
        throw new Error(`Unknown device type: ${platform.GetCode()}.${type}=${name}`);
      throw err;
    }
  }

  get icon() { return "fa fa-random" }

  SendMessage(topic, message) {
    this.platform.SendMessage(topic, message);
  }
  ProcessMessage(topic, message) { return false; }
  ProcessMessageObj(topic, messageobj) { return false; }
}
module.exports = MqttDevice;