const Device = require('../Device')

class MediaDevice extends Device {
  static GetTypes() {
    return {
      LgTv: { displayname: 'LG Tv', devicename: 'lgtv_'.toLowerCase(), icon: 'fa fa-tv' }
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
module.exports = MediaDevice
