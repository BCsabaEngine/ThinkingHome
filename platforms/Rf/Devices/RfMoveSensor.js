const RfDevice = require('../RfDevice');
const { MoveEntity } = require('../../Entity');

class RfMoveSensor extends RfDevice {
  setting = {
    rfcode: '',
    toDisplayList: function () {
      const result = {};
      result["rfcode"] = {
        type: 'text',
        title: 'Open RF code',
        value: this.setting.rfcode,
        error: !this.setting.rfcode,
        canclear: false,
      };
      return result;
    }.bind(this),
    toTitle: function () { return "Move sensor" }.bind(this),
    toSubTitle: function () { return ''; }.bind(this),
  };
  get icon() { return this.setting.icon || "fa fa-running"; }
  entities = {
    move: new MoveEntity(this, 'move', 'Move', "fa fa-running")
  };
  GetStatusInfos() {
    const result = [];
    if (!this.setting.rfcode) result.push({ device: this, error: true, message: 'RF code not set' });
    return result;
  };
  ReceiveRfCode(rfcode) {
    if (rfcode == this.setting.rfcode) {
      this.entities.move.DoMove();
      return true;
    }
    return false;
  }
}
module.exports = RfMoveSensor;