const PresenceMachine = require('./Machine');

class PresenceConsole extends PresenceMachine {
  get icon() { return "fa fa-gamepad" }
}
module.exports = PresenceConsole;