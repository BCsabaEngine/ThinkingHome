const RfDevice = require('../RfDevice')
const { Entity } = require('../../Entity')
const { ButtonAction } = require('../../Action')
const { OnOffToggleBoardItem } = require('../../BoardItem')

class RfSwitch extends RfDevice {
  setting = {
    handlerdevice: null,
    rfcodeon: '',
    rfcodetoggle: '',
    rfcodeoff: '',
    toDisplayList: function () {
      const result = {}

      const senders = global.runningContext.rfInterCom.GetSenderDevices()

      const devicelist = {}
      for (const device of senders) { devicelist[device.id] = device.name }
      result.handlerdevice = {
        type: 'select',
        title: __('Handler device'),
        value: this.setting.handlerdevice,
        displayvalue: function () {
          if (this.setting.handlerdevice) {
            const owned = senders.find(d => d.id === Number(this.setting.handlerdevice))
            if (owned) { return owned.name }
          }
          return __('All device')
        }.bind(this)(),
        lookup: JSON.stringify(devicelist).replace(/["]/g, "'"),
        error: false,
        canclear: true
      }

      result.rfcodeon = {
        type: 'text',
        title: __('On RF code'),
        value: this.setting.rfcodeon,
        error: !this.setting.rfcodeon,
        canclear: false
      }
      result.rfcodetoggle = {
        type: 'text',
        title: __('Toggle RF code'),
        value: this.setting.rfcodetoggle,
        error: false,
        canclear: true
      }
      result.rfcodeoff = {
        type: 'text',
        title: __('Off RF code'),
        value: this.setting.rfcodeoff,
        error: !this.setting.rfcodeoff,
        canclear: false
      }
      return result
    }.bind(this),
    toTitle: function () { return __('RF switch') },
    toSubTitle: function () { return '' }
  };

  get icon() { return this.setting.icon || 'fa fa-toggle-on' }
  entities = {
    state: new Entity(this, 'state', 'State', 'fa fa-door-open')
      .AddAction(new ButtonAction(this, 'switchon', 'Switch on', 'fa fa-toggle-on', function () { this.device.SendRfCode(this.device.setting.handlerdevice, this.device.setting.rfcodeon) }))
      .AddAction(new ButtonAction(this, 'toggle', 'Toggle', 'fa fa-toggle-on', function () { this.device.SendRfCode(this.device.setting.handlerdevice, this.device.setting.rfcodetoggle) }))
      .AddAction(new ButtonAction(this, 'switchoff', 'Switch off', 'fa fa-toggle-off', function () { this.device.SendRfCode(this.device.setting.handlerdevice, this.device.setting.rfcodeoff) }))
      .AddBoardItem(new OnOffToggleBoardItem())
  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.rfcodeon) result.push({ device: this, error: true, message: __('On RF code not set') })
    if (!this.setting.rfcodeoff) result.push({ device: this, error: true, message: __('Off RF code not set') })
    return result
  }
}
module.exports = RfSwitch
