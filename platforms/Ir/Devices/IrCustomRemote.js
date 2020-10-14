const IrButton = require('./IrButton')

class IrCustomRemote extends IrButton {
  buttons = Array.from('ABCD1234567890')

  constructor(id, platform, name) {
    super(id, platform, name)

    for (const button of this.buttons) { this.setting[`ircode${button}`] = '' }
  }

  get icon() { return this.setting.icon || 'fa fa-keyboard' }
}
module.exports = IrCustomRemote
