const Device = require('../Device')

class YeelightDevice extends Device {
  static GetTypes() {
    return {
      WhiteLamp: { displayname: 'White lamp', devicename: 'yeelight_'.toLowerCase(), icon: 'fa fa-lightbulb' },
      ColorLamp: { displayname: 'Color lamp', devicename: 'yeelight_'.toLowerCase(), icon: 'fa fa-lightbulb' }
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

  get icon() { return 'fa fa-lightbulb' }

  SendMessage(topic, message) {
    this.platform.SendMessage(topic, message)
  }

  ProcessMessage(topic, message) { return false }
  ProcessMessageObj(topic, messageobj) { return false }
}
module.exports = YeelightDevice
