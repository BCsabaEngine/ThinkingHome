const Device = require('../Device');

class RfDevice extends Device {
  static GetTypes() {
    return {
      'RfPushButton': { displayname: 'Push button', devicename: 'RfPushButton_'.toLowerCase(), icon: 'fa fa-dot-circle' },
      'RfDoorSensor': { displayname: 'Door sensor', devicename: 'RfDoor_'.toLowerCase(), icon: 'fa fa-door-open' },
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

  get icon() { return "fa fa-broadcast-tower" }

  SendRfCode(rfcode) { this.platform.SendRfCode(rfcode); }
  ReceiveRfCode(rfcode) { return false; }
}
module.exports = RfDevice;