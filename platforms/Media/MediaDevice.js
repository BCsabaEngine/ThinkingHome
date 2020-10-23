const Device = require('../Device')

class MediaDevice extends Device {
  static GetTypes() {
    return {
      Mobile: { displayname: 'Mobile', devicename: 'PresenceMobile'.toLowerCase(), icon: 'fa fa-mobile-alt' },
      Laptop: { displayname: 'Laptop', devicename: 'PresenceLaptop'.toLowerCase(), icon: 'fa fa-laptop' },
      Desktop: { displayname: 'Desktop computer', devicename: 'PresenceDesktop'.toLowerCase(), icon: 'fa fa-desktop' },
      Tv: { displayname: 'TV', devicename: 'PresenceTv'.toLowerCase(), icon: 'fa fa-tv' },
      Console: { displayname: 'Game console', devicename: 'PresenceConsole'.toLowerCase(), icon: 'fa fa-gamepad' },

      Human: { displayname: 'Family member', devicename: 'PresenceHuman'.toLowerCase(), icon: 'fa fa-user-circle' }
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
