const Device = require('../Device');

class MqttDevice extends Device {
  static GetTypes() {
    return {
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

  icon = "fa fa-random";

  SendMessage(topic, message) {
    this.platform.SendMessage(topic, message);
  }
  ProcessMessage(topic, message) { return false; }
  ProcessMessageObj(topic, messageobj) { return false; }
}
module.exports = MqttDevice;