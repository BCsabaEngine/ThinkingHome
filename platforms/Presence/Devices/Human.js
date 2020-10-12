const PresenceDevice = require('../PresenceDevice')
const { BoolStateEntity } = require('../../Entity')
const PresenceMachine = require('./Machine')
const { PresenceBoardItem } = require('../../BoardItem')

class PresenceHuman extends PresenceDevice {
  setting = {
    device1: '',
    device2: '',
    device3: '',
    toDisplayList: function () {
      const result = {}

      const devicelist = {}
      for (const device of this.platform.devices) {
        if (device instanceof PresenceMachine) { devicelist[device.id] = device.name }
      }

      for (let i = 1; i <= 3; i++) {
        const name = `device${i}`
        const value = this.setting[name]
        result[name] = {
          type: 'select',
          title: `Owned device #${i}`,
          value: value,
          displayvalue: function () {
            if (value) {
              const owned = this.platform.devices.find(d => d.id === value)
              if (owned) { return owned.name }
            }
            return ''
          }.bind(this)(),
          lookup: JSON.stringify(devicelist).replace(/["]/g, "'"),
          error: i === 1 && !this.setting[`device${i}`],
          canclear: i !== 1
        }
      }
      return result
    }.bind(this),
    toTitle: function () { return this.entities.home }.bind(this),
    toSubTitle: function () { return '' }
  };

  get icon() { return 'fa fa-user-circle' }
  entities = {
    home: new BoolStateEntity(this, 'home', 'At home', 'fa fa-user-circle')
      .InitStateNames('Away', 'Home')
      .InitStateIcons('fa fa-user-slash', 'fa fa-home')
      .AddBoardItem(new PresenceBoardItem())
  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.device1) result.push({ device: this, error: true, message: 'One device needed' })
    return result
  }

  Tick(seconds) {
    if (seconds % 60 !== 0) { return }

    let exists = false
    for (let i = 1; i <= 3; i++) {
      const deviceid = this.setting[`device${i}`]
      if (deviceid) {
        for (const device of this.platform.devices) {
          if (device.id === deviceid) {
            if (device.entities.home.state) { exists = true }
          }
        }
      }
    }
    this.entities.home.SetState(exists)
  }
}
module.exports = PresenceHuman
