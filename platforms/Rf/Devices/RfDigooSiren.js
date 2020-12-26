const RfDevice = require('../RfDevice')
const { Entity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

class RfDigooSiren extends RfDevice {
  setting = {
    rfprefix: '',
    toDisplayList: function () {
      const result = {}
      result.rfprefix = {
        type: 'text',
        title: __('RF prefix (4 hex digit)'),
        value: this.setting.rfprefix,
        error: !this.setting.rfprefix,
        canclear: true
      }
      if (this.setting.rfprefix) {
        result.rfsos = {
          type: 'label',
          title: __('SOS RF code'),
          value: this.GetSOSCode()
        }
        result.rfdisarm = {
          type: 'label',
          title: __('Disarm RF code'),
          value: this.GetDisarmCode()
        }
        result.sendsos = {
          type: 'button',
          title: __('Send SOS code'),
          value: __('Learn or test'),
          onexecute: function () {
            const sos = this.GetSOSCode()
            if (sos) {
              this.SendRfCode(null, sos)
            }
          }.bind(this)
        }
        result.senddisarm = {
          type: 'button',
          title: __('Send disarm'),
          value: __('Make silence'),
          onexecute: function () {
            const disarm = this.GetDisarmCode()
            if (disarm) { this.SendRfCode(null, disarm) }
          }.bind(this)
        }
      }
      return result
    }.bind(this),
    toTitle: function () { return __('Digoo Siren') },
    toSubTitle: function () { return this.GetSOSCode() }.bind(this)
  };

  GetSOSCode() {
    if (this.setting.rfprefix) { return `[433]${this.setting.rfprefix}88#24` }
    return null
  }

  GetDisarmCode() {
    if (this.setting.rfprefix) { return `[433]${this.setting.rfprefix}82#24` }
    return null
  }

  get icon() { return this.setting.icon || 'fa fa-volume-up' }
  entities = {
    alarm: new Entity(this, 'alarm', 'Alarm', 'fa fa-volume-up')
      .AddAction(new ButtonAction(this, 'alarm', 'Alarm', 'fa fa-volume-up', function () { if (this.device.GetSOSCode()) this.device.SendRfCode(null, this.device.GetSOSCode()) }))
      .AddAction(new ButtonAction(this, 'disarm', 'Disarm', 'fa fa-volume-mute', function () { if (this.device.GetDisarmCode()) this.device.SendRfCode(null, this.device.GetDisarmCode()) }))
  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.rfprefix) result.push({ device: this, error: true, message: __('RF prefix not set') })
    return result
  }
}
module.exports = RfDigooSiren
