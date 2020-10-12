const PresenceMachine = require('./Machine')

class PresenceMobile extends PresenceMachine {
  get icon() { return 'fa fa-mobile-alt' }
}
module.exports = PresenceMobile
