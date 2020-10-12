const Device = require('../Device')

class RaspberryPiDevice extends Device {
  static GetTypes() {
    return {
      Cpu: { displayname: 'CPU', devicename: 'RPiCpu'.toLowerCase(), icon: 'fa fa-microchip' },
      Disk: { displayname: 'Disk', devicename: 'RPiDisk'.toLowerCase(), icon: 'fa fa-hdd' }
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
module.exports = RaspberryPiDevice
