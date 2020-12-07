const RfDevice = require('../RfDevice')
const { BoolStateEntity } = require('../../Entity')
const { BoolStateBoardItem } = require('../../BoardItem')

class RfDoorSensor extends RfDevice {
  setting = {
    rfcodeopen: '',
    rfcodeclose: '',
    toDisplayList: function () {
      const result = {}
      result.rfcodeopen = {
        type: 'text',
        title: __('Open RF code'),
        value: this.setting.rfcodeopen,
        error: !this.setting.rfcodeopen,
        canclear: false
      }
      result.rfcodeclose = {
        type: 'text',
        title: __('Close RF code'),
        value: this.setting.rfcodeclose,
        error: !this.setting.rfcodeclose,
        canclear: false
      }
      return result
    }.bind(this),
    toTitle: function () { return __('Door sensor') },
    toSubTitle: function () { return '' }
  };

  get icon() { return this.setting.icon || 'fa fa-door-open' }
  entities = {
    state: new BoolStateEntity(this, 'state', 'State', 'fa fa-door-open')
      .InitStateNames('Closed', 'Open')
      .InitStateIcons('fa fa-door-closed', 'fa fa-door-open')
      .InitLastState()
      .AddBoardItem(new BoolStateBoardItem())
  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.rfcodeopen) result.push({ device: this, error: true, message: __('Open RF code not set') })
    if (!this.setting.rfcodeclose) result.push({ device: this, error: true, message: __('Close RF code not set') })
    return result
  }

  ReceiveRfCode(rfcode) {
    if (rfcode === this.setting.rfcodeopen) {
      this.entities.state.SetState(1)
      return true
    }
    if (rfcode === this.setting.rfcodeclose) {
      this.entities.state.SetState(0)
      return true
    }
    return false
  }
}
module.exports = RfDoorSensor
