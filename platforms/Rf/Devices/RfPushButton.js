const RfDevice = require('../RfDevice');
const { PushButtonEntity } = require('../../Entity');

class RfPushButton extends RfDevice {
  buttons = [''];

  constructor(id, platform, name) {
    super(id, platform, name);

    for (const button of this.buttons)
      this.setting[`rfcode${button}`] = '';
  }

  InitEntities() {
    for (const button of this.buttons)
      this.entities[`button${button}`] = new PushButtonEntity(this, `button${button}`, `Button ${button}`.trim(), "fa fa-dot-circle");

    this.LinkUpEntities();
  };

  setting = {
    toDisplayList: function () {
      const result = {};
      for (const button of this.buttons)
        result[`rfcode${button}`] = {
          type: 'text',
          title: `RF code ${button}`.trim(),
          value: this.setting[`rfcode${button}`],
          error: false,
          canclear: true,
        };
      return result;
    }.bind(this),
    toTitle: function () { return this.buttons.length > 1 ? `${this.buttons.length}ch button` : "Push button" }.bind(this),
    toSubTitle: function () {
      if (this.buttons.length == 1)
        return this.setting.rfcode;
      let count = 0;
      for (const button of this.buttons)
        if (this.setting[`rfcode${button}`])
          count++;
      return `${count} / ${this.buttons.length} codes`;
    }.bind(this),
  };
  get icon() { return this.setting.icon || "fa fa-code-branch"; }
  GetStatusInfos() {
    const result = [];
    let anyfilled = false;
    for (const button of this.buttons)
      if (this.setting[`rfcode${button}`])
        anyfilled = true;
    if (!anyfilled) result.push({ device: this, error: true, message: 'None of code set' });
    return result;
  };
  async Start() {
    await super.Start();
    this.InitEntities();
  };

  ReceiveRfCode(rfcode) {
    for (const button of this.buttons)
      if (rfcode == this.setting[`rfcode${button}`]) {
        if (this.entities[`button${button}`]) {
          this.entities[`button${button}`].DoPress();
          return true;
        }
      }
    return false;
  }
}
module.exports = RfPushButton;