const Device = require('../Device')

class IrDevice extends Device {
  static GetTypes() {
    return {
      IrButton: { displayname: 'Button', devicename: 'IrButton_'.toLowerCase(), icon: 'fa fa-hockey-puck' },
      IrTvRemote: { displayname: 'TV remote', devicename: 'IrTvRemote_'.toLowerCase(), icon: 'fa fa-keyboard' },
      IrCustomRemote: { displayname: 'Custom remote', devicename: 'IrCustomRemote_'.toLowerCase(), icon: 'fa fa-keyboard' },
      IrButtonSequence: { displayname: 'Button sequence', devicename: 'IrSeq_'.toLowerCase(), icon: 'fa fa-angle-double-right' },
      IrClimate: { displayname: 'Air climate', devicename: 'IrClimate_'.toLowerCase(), icon: 'fa fa-icicles' }
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

  IsHandledBy(handlerdevice) { return false }
}
module.exports = IrDevice
