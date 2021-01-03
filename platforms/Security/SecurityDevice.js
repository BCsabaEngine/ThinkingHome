const Device = require('../Device')

class SecurityDevice extends Device {
  static GetTypes() {
    return {
      HikvisionIsapi: { displayname: 'Hikvision ISAPI', devicename: 'cam_'.toLowerCase(), icon: 'fa fa-video' }
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
module.exports = SecurityDevice
