const Device = require('../Device')

class RfDevice extends Device {
  static GetTypes() {
    return {
      RfPushButton: { displayname: 'Push button', devicename: 'RfPushButton_'.toLowerCase(), icon: 'fa fa-dot-circle' },
      RfPushButton4ch: { displayname: '4ch button', devicename: 'RfPushButton4ch_'.toLowerCase(), icon: 'fa fa-dot-circle' },
      RfSwitch: { displayname: 'Switch', devicename: 'RfSwitch_'.toLowerCase(), icon: 'fa fa-toggle-on' },
      RfDoorSensor: { displayname: 'Door sensor', devicename: 'RfDoor_'.toLowerCase(), icon: 'fa fa-door-open' },
      RfMoveSensor: { displayname: 'Move sensor', devicename: 'RfMove_'.toLowerCase(), icon: 'fa fa-running' },
      RfDigooSiren: { displayname: 'Digoo siren', devicename: 'RfDigooSiren_'.toLowerCase(), icon: 'fa fa-volume-up' }
    }
  }

  static CreateByType(type, id, platform, name) {
    try {
      const TypeClass = require('./Devices/' + type)
      return new TypeClass(id, platform, name)
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') { throw new Error(`Unknown device type: ${platform.GetCode()}.${type}=${name}`) }
      throw err
    }
  }

  get icon() { return 'fa fa-broadcast-tower' }

  SendRfCode(handlerdevice, rfcode) { this.platform.SendRfCode(handlerdevice, rfcode) }
  ReceiveRfCode(rfcode) { return false }
}
module.exports = RfDevice
