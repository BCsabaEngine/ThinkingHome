const fs = require('fs');
const path = require('path');
const Device = require('../Device');

class RaspberryPiDevice extends Device {
  static GetTypes() {
    return {
      'Cpu': { displayname: 'CPU', devicename: 'RPiCpu'.toLowerCase(), icon: 'fa fa-microchip' },
      'Disk': { displayname: 'Disk', devicename: 'RPiDisk'.toLowerCase(), icon: 'fa fa-hdd' },
    }
  }
  static CreateByType(type, id, platform, name) {
    try {
      const typeclass = require('./Devices/' + type);
      return new typeclass(id, platform, name);
    }
    catch (err) {
      console.log(err);
      if (err.code == 'MODULE_NOT_FOUND')
        throw new Error(`Unknown device type: ${platform.GetCode()}.${type}=${name}`);
      throw err;
    }
  }
}
module.exports = RaspberryPiDevice;