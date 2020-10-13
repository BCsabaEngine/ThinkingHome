const Device = require('../Device')

class IrDevice extends Device {
  static GetTypes() {
    return {
      IrButton: { displayname: 'Button', devicename: 'IrButton_'.toLowerCase(), icon: 'fa fa-rss' },
      IrTvRemote: { displayname: 'TV remote', devicename: 'IrTvRemote_'.toLowerCase(), icon: 'fa fa-rss' }
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

  get icon() { return 'fa fa-rss' }

  SendIrCode(handlerdevice, ircode) { this.platform.SendIrCode(handlerdevice, ircode) }
  ReceiveIrCode(handlerdevice, ircode) { return false }
}
module.exports = IrDevice
