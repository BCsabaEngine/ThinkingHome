const PresenceDevice = require('../PresenceDevice')
const { BoolStateEntity } = require('../../Entity')
const { PresenceBoardItem } = require('../../BoardItem')

class PresenceMachine extends PresenceDevice {
  setting = {
    macaddress: '',
    macaddress2: '',
    leavetoleranceminutes: 5,
    toDisplayList: function () {
      const result = {}

      const macaddresslist = {}
      for (const macaddress of Object.keys(this.platform.macaddresses)) {
        const vendor = this.platform.macaddresses[macaddress]
        if (vendor) { macaddresslist[macaddress] = `${macaddress}&nbsp;&nbsp;&nbsp;(${vendor})` } else { macaddresslist[macaddress] = `${macaddress}` }
      }
      result.macaddress = {
        type: 'select',
        title: __('MAC address'),
        value: this.setting.macaddress,
        lookup: JSON.stringify(macaddresslist).replace(/["]/g, "'"),
        error: !this.setting.macaddress,
        canclear: false
      }
      result.macaddress2 = {
        type: 'select',
        title: __('MAC address #2'),
        value: this.setting.macaddress2,
        lookup: JSON.stringify(macaddresslist).replace(/["]/g, "'"),
        error: false,
        canclear: true
      }

      const intervallist = {}
      // eslint-disable-next-line no-magic-numbers
      for (const interval of [1, 2, 3, 4, 5, 10, 15]) intervallist[interval] = __n('%s minute', '%s minutes', interval)

      result.leavetoleranceminutes = {
        type: 'select',
        title: __('Leave tolerance'),
        value: this.setting.leavetoleranceminutes,
        displayvalue: __('%s minutes', this.setting.leavetoleranceminutes),
        lookup: JSON.stringify(intervallist).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }

      return result
    }.bind(this),
    toTitle: function () { return this.entities.home }.bind(this),
    toSubTitle: function () { return this.setting.macaddress }.bind(this)
  };

  get icon() { return 'fa fa-laptop' }
  entities = {
    home: new BoolStateEntity(this, 'home', 'At home', 'fa fa-laptop-house')
      .InitStateNames('Away', 'Home')
      .InitStateIcons('fa fa-microphone-slash', 'fa fa-laptop-house')
      .InitLastState()
      .AddBoardItem(new PresenceBoardItem())
  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.macaddress) result.push({ device: this, error: true, message: __('MAC address not set') })
    return result
  }

  Tick(seconds) {
    if (seconds % 60 !== 0) { return }

    const platformmacaddresses = Object.keys(this.platform.macaddresses)
    const exists =
      (this.setting.macaddress && platformmacaddresses.includes(this.setting.macaddress)) ||
      (this.setting.macaddress2 && platformmacaddresses.includes(this.setting.macaddress2))

    const entity = this.entities.home
    if (exists) { return entity.SetState(true) }

    if ((new Date().getTime() - entity.laststatetime) > this.setting.leavetoleranceminutes * 60 * 1000) { entity.SetState(false) }
  }
}
module.exports = PresenceMachine
