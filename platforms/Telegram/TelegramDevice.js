const Device = require('../Device')

class TelegramDevice extends Device {
  static GetTypes() {
    return {
      Chat: { displayname: 'Chat', devicename: 'chat_'.toLowerCase(), icon: 'fa fa-comment-alt' }
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
}
module.exports = TelegramDevice
