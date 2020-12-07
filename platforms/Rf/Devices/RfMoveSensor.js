const RfDevice = require('../RfDevice')
const { EventEntity } = require('../../Entity')

class RfMoveSensor extends RfDevice {
  setting = {
    rfcode: '',
    toDisplayList: function () {
      const result = {}
      result.rfcode = {
        type: 'text',
        title: __('Move RF code'),
        value: this.setting.rfcode,
        error: !this.setting.rfcode,
        canclear: false
      }
      return result
    }.bind(this),
    toTitle: function () { return __('Move sensor') },
    toSubTitle: function () { return '' }
  };

  get icon() { return this.setting.icon || 'fa fa-running' }
  entities = {
    move: new EventEntity(this, 'move', 'Move', 'fa fa-running').InitEvents(['move'])
  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.rfcode) result.push({ device: this, error: true, message: __('RF code not set') })
    return result
  }

  ReceiveRfCode(rfcode) {
    if (rfcode === this.setting.rfcode) {
      this.entities.move.DoEvent('move')
      return true
    }
    return false
  }
}
module.exports = RfMoveSensor
