const Device = require('../Device')

class ZigbeeDevice extends Device {
  static GetTypes() {
    return {
      LightSensor: { displayname: 'Light sensor', devicename: 'ieee_'.toLowerCase(), icon: 'fa fa-low-vision' },
      TempSensor: { displayname: 'Temp sensor', devicename: 'ieee_'.toLowerCase(), icon: 'fa fa-thermometer-half' },
      E1743: { displayname: 'TRÅDFRI on/off', devicename: 'ieee_'.toLowerCase(), icon: 'fa fa-toggle-on' },
      E1744: { displayname: 'SYMFONISK sound', devicename: 'ieee_'.toLowerCase(), icon: 'fa fa-tablets' },
      AqaraCube: { displayname: 'Aqara magic cube', devicename: 'ieee_'.toLowerCase(), icon: 'fa fa-cube' }
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

  get icon() { return 'fa fa-hive' }

  SendMessage(topic, message) {
    this.platform.SendMessage(topic, message)
  }

  ProcessMessage(topic, message) { return false }
  ProcessMessageObj(topic, messageobj) { return false }
}
module.exports = ZigbeeDevice
