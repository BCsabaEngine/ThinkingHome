const RfDevice = require('../RfDevice');
const { Entity, BoolStateEntity } = require('../../Entity');
const { BoolStateBoardItem } = require('../../BoardItem');
const { ButtonAction, SelectAction, RangeAction, } = require('../../Action');
const { OnOffToggleBoardItem } = require('../../BoardItem');

class RfSwitch extends RfDevice {
  setting = {
    rfcodeon: '',
    rfcodetoggle: '',
    rfcodeoff: '',
    toDisplayList: function () {
      const result = {};
      result["rfcodeon"] = {
        type: 'text',
        title: 'On RF code',
        value: this.setting.rfcodeon,
        error: !this.setting.rfcodeon,
        canclear: false,
      };
      result["rfcodetoggle"] = {
        type: 'text',
        title: 'Toggle RF code',
        value: this.setting.rfcodetoggle,
        error: false,
        canclear: true,
      };
      result["rfcodeoff"] = {
        type: 'text',
        title: 'Off RF code',
        value: this.setting.rfcodeoff,
        error: !this.setting.rfcodeoff,
        canclear: false,
      };
      return result;
    }.bind(this),
    toTitle: function () { return "RF switch" }.bind(this),
    toSubTitle: function () { return ''; }.bind(this),
  };
  get icon() { return this.setting.icon || "fa fa-toggle-on"; }
  entities = {
    state: new Entity(this, 'state', 'State', "fa fa-door-open")
      .AddAction(new ButtonAction(this, "switchon", "Switch on", "fa fa-toggle-on", function () { this.device.SendRfCode(this.device.setting.rfcodeon); }))
      .AddAction(new ButtonAction(this, "toggle", "Toggle", "fa fa-toggle-on", function () { this.device.SendRfCode(this.device.setting.rfcodetoggle); }))
      .AddAction(new ButtonAction(this, "switchoff", "Switch off", "fa fa-toggle-off", function () { this.device.SendRfCode(this.device.setting.rfcodeoff); }))
      .AddBoardItem(new OnOffToggleBoardItem())
  };
  GetStatusInfos() {
    const result = [];
    if (!this.setting.rfcodeon) result.push({ device: this, error: true, message: 'On RF code not set' });
    if (!this.setting.rfcodeoff) result.push({ device: this, error: true, message: 'Off RF code not set' });
    return result;
  };
}
module.exports = RfSwitch;