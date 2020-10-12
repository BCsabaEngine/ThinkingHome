const Device = require('../Device')

class IrDevice extends Device {
  static GetTypes() {
    return {
      IrRemoteController: { displayname: 'Push button', devicename: 'IrPushButton_'.toLowerCase(), icon: 'fa fa-rss' }
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

  SendIrCode(ircode) { this.platform.SendIrCode(ircode) }
  ReceiveIrCode(ircode) { return false }
}
module.exports = IrDevice
