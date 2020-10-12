const RfPushButton = require('./RfPushButton')

class RfPushButton4ch extends RfPushButton {
  buttons = ['A', 'B', 'C', 'D'];

  constructor(id, platform, name) {
    super(id, platform, name)

    for (const button of this.buttons) { this.setting[`rfcode${button}`] = '' }
  }
}
module.exports = RfPushButton4ch
