const PresenceMachine = require('./Machine')

class PresenceDesktop extends PresenceMachine {
  get icon() { return 'fa fa-desktop' }
}
module.exports = PresenceDesktop
