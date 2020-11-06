const IrSenderDevice = require('../IrSenderDevice')
const { EventEntity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

class IrButton extends IrSenderDevice {
  buttons = [''];

  constructor(id, platform, name) {
    super(id, platform, name)

    for (const button of this.buttons) { this.setting[`ircode${button}`] = '' }
  }

  InitEntities() {
    for (const button of this.buttons) {
      this.entities[`button${button}`] =
        new EventEntity(this, `button${button}`, `Button ${button}`.trim(), 'fa fa-dot-circle')
          .InitEvents(['press'])
          .AddAction(new ButtonAction(this, 'press', 'Press', 'fa fa-rss', function () { this.device.entities[`button${button}`].DoEvent('press') }))
    }

    this.LinkUpEntities()
  }

  setting = {
    handlerdevice: null,
    toDisplayList: function () {
      const result = {}

      const receivers = global.runningContext.irInterCom.GetReceiverDevices()

      const devicelist = {}
      for (const device of receivers) { devicelist[device.id] = device.name }
      result.handlerdevice = {
        type: 'select',
        title: 'Handler device',
        value: this.setting.handlerdevice,
        displayvalue: function () {
          if (this.setting.handlerdevice) {
            const owned = receivers.find(d => d.id === Number(this.setting.handlerdevice))
            if (owned) { return owned.name }
          }
          return ''
        }.bind(this)(),
        lookup: JSON.stringify(devicelist).replace(/["]/g, "'"),
        error: !this.setting.handlerdevice,
        canclear: false
      }

      for (const button of this.buttons) {
        result[`ircode${button}`] = {
          type: 'text',
          title: `IR code ${button}`.trim(),
          value: this.setting[`ircode${button}`],
          error: false,
          canclear: this.buttons.length > 1
        }
      }
      return result
    }.bind(this),
    toTitle: function () { return this.buttons.length > 1 ? `${this.buttons.length} button` : 'Button' }.bind(this),
    toSubTitle: function () {
      if (this.buttons.length === 1) { return this.setting.ircode }
      let count = 0
      for (const button of this.buttons) {
        if (this.setting[`ircode${button}`]) { count++ }
      }
      return `${count} / ${this.buttons.length} codes`
    }.bind(this)
  };

  get icon() { return this.setting.icon || 'fa fa-hockey-puck' }
  GetStatusInfos() {
    const result = []
    if (!this.setting.handlerdevice) result.push({ device: this, error: true, message: 'Handler device not set' })
    let anyfilled = false
    for (const button of this.buttons) {
      if (this.setting[`ircode${button}`]) { anyfilled = true }
    }
    if (!anyfilled) result.push({ device: this, error: true, message: 'None of code set' })
    return result
  }

  async Start() {
    await super.Start()
    this.InitEntities()
  }

  IsHandledBy(handlerdevice) { return Number(this.setting.handlerdevice) === handlerdevice }
  CollectConfigToSend(handlerdevice) {
    const result = []

    if (Number(this.setting.handlerdevice) === handlerdevice) {
      for (const button of this.buttons) {
        const ircode = this.setting[`ircode${button}`]
        if (ircode && ircode.length > 0) { result.push(ircode) }
      }
    }

    return result
  }

  ReceiveIrCode(handlerdevice, ircode) {
    if (Number(this.setting.handlerdevice) !== handlerdevice) { return false }

    for (const button of this.buttons) {
      if (this.setting[`ircode${button}`]) {
        if (ircode === this.setting[`ircode${button}`]) {
          if (this.entities[`button${button}`]) {
            this.entities[`button${button}`].DoEvent('press')
            return true
          }
        }
      }
    }

    return false
  }
}
module.exports = IrButton
