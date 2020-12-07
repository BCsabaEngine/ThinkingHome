const RfDevice = require('../RfDevice')
const { EventEntity } = require('../../Entity')

class RfPushButton extends RfDevice {
  buttons = [''];

  constructor(id, platform, name) {
    super(id, platform, name)

    for (const button of this.buttons) this.setting[`rfcode${button}`] = ''
  }

  InitEntities() {
    for (const button of this.buttons) this.entities[`button${button}`] = new EventEntity(this, `button${button}`, `Button ${button}`.trim(), 'fa fa-dot-circle').InitEvents(['press'])

    this.LinkUpEntities()
  }

  setting = {
    toDisplayList: function () {
      const result = {}
      for (const button of this.buttons) {
        result[`rfcode${button}`] = {
          type: 'text',
          title: __('RF code %s', button).trim(),
          value: this.setting[`rfcode${button}`],
          error: false,
          canclear: this.buttons.length > 1
        }
      }
      return result
    }.bind(this),
    toTitle: function () { return this.buttons.length > 1 ? __('%sch button', this.buttons.length) : __('Push button') }.bind(this),
    toSubTitle: function () {
      if (this.buttons.length === 1) { return this.setting.rfcode }
      let count = 0
      for (const button of this.buttons) {
        if (this.setting[`rfcode${button}`]) { count++ }
      }
      return __('%s / %s codes', count, this.buttons.length)
    }.bind(this)
  };

  get icon() { return this.setting.icon || 'fa fa-dot-circle' }
  GetStatusInfos() {
    const result = []
    let anyfilled = false
    for (const button of this.buttons) {
      if (this.setting[`rfcode${button}`]) { anyfilled = true }
    }
    if (!anyfilled) result.push({ device: this, error: true, message: __('None of code set') })
    return result
  }

  async Start() {
    await super.Start()
    this.InitEntities()
  }

  ReceiveRfCode(rfcode) {
    for (const button of this.buttons) {
      if (rfcode === this.setting[`rfcode${button}`]) {
        if (this.entities[`button${button}`]) {
          this.entities[`button${button}`].DoEvent('press')
          return true
        }
      }
    }
    return false
  }
}
module.exports = RfPushButton
