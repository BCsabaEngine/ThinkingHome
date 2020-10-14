const IrButton = require('./IrButton')

class IrTvRemote extends IrButton {
  buttons = [
    'Prev', 'Rec', 'Play', 'Pause', 'Stop', 'Next',
    'Red', 'Green', 'Yellow', 'Blue']

  constructor(id, platform, name) {
    super(id, platform, name)

    for (const button of this.buttons) { this.setting[`ircode${button}`] = '' }
  }

  get icon() { return this.setting.icon || 'fa fa-keyboard' }
}
module.exports = IrTvRemote
