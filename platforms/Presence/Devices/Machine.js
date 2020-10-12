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
        title: 'MAC address',
        value: this.setting.macaddress,
        lookup: JSON.stringify(macaddresslist).replace(/["]/g, "'"),
        error: !this.setting.macaddress,
        canclear: false
      }
      result.macaddress2 = {
        type: 'select',
        title: 'MAC address #2',
        value: this.setting.macaddress2,
        lookup: JSON.stringify(macaddresslist).replace(/["]/g, "'"),
        error: false,
        canclear: true
      }

      const intervallist = { 1: '1 minute', 2: '2 minutes', 3: '3 minutes', 4: '4 minutes', 5: '5 minutes', 10: '10 minutes', 15: '15 minutes' }
      result.leavetoleranceminutes = {
        type: 'select',
        title: 'Leave tolerance',
        value: this.setting.leavetoleranceminutes,
        displayvalue: `${this.setting.leavetoleranceminutes} minutes`,
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
      .AddBoardItem(new PresenceBoardItem())
  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.macaddress) result.push({ device: this, error: true, message: 'MAC address not set' })
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
