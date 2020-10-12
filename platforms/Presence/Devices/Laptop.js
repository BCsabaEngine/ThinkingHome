const PresenceMachine = require('./Machine')

class PresenceLaptop extends PresenceMachine {
  get icon() { return 'fa fa-laptop' }
}
module.exports = PresenceLaptop
