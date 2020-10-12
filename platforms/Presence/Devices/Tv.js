const PresenceMachine = require('./Machine')

class PresenceTv extends PresenceMachine {
  get icon() { return 'fa fa-tv' }
}
module.exports = PresenceTv
