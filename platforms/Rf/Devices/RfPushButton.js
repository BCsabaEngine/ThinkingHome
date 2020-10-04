const RfDevice = require('../RfDevice');
const { PushButtonEntity } = require('../../Entity');
const { ButtonAction, SelectAction, RangeAction, } = require('../../Action');
const { ToggleBoardItem, PushBoardItem, } = require('../../BoardItem');

class RfPushButton extends RfDevice {
  setting = {
    rfcode: '',
    toDisplayList: function () {
      const result = {};
      result["rfcode"] = {
        type: 'text',
        title: 'RF code',
        value: this.setting.rfcode,
        error: !this.setting.rfcode,
        canclear: false,
      };
      return result;
    }.bind(this),
    toTitle: function () { return "Push button" }.bind(this),
    toSubTitle: function () { return this.setting.rfcode; }.bind(this),
  };
  get icon() { return this.setting.icon || "fa fa-code-branch"; }
  entities = {
    button: new PushButtonEntity(this, 'button', 'Button', "fa fa-dot-circle")
      .AddAction(new ButtonAction(this, "push", "Push", "fa fa-dot-circle", function () { this.device.entities.button.DoPress(); })),
  };
  GetStatusInfos() {
    const result = [];
    if (!this.setting.rfcode) result.push({ device: this, error: true, message: 'RF code not set' });
    return result;
  };
  ReceiveRfCode(rfcode) {
    if (rfcode == this.setting.rfcode) {
      this.entities.button.DoPress();
      return true;
    }
    return false;
  }
}
module.exports = RfPushButton;