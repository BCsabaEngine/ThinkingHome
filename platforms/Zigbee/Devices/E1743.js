const GenericDevice = require('./GenericDevice')
const { EventEntity } = require('../../Entity')

class E1743 extends GenericDevice {
  ProcessSpecificMessageObj(messageobj) {
    switch (messageobj.action) {
      case 'on':
        this.entities.pushbutton.DoEvent('on')
        break
      case 'off':
        this.entities.pushbutton.DoEvent('off')
        break
      case 'brightness_move_up':
        this.entities.pushbutton.DoEvent('hold_up')
        break
      case 'brightness_move_down':
        this.entities.pushbutton.DoEvent('hold_down')
        break
      case 'brightness_stop':
        this.entities.pushbutton.DoEvent('hold_release')
        break
      default:
        break
    }
  }

  entities = {
    pushbutton: new EventEntity(this, 'pushbutton', 'Push button', 'fa fa-toggle-on')
      .InitEvents(['on', 'off', 'hold_up', 'hold_down', 'hold_release'])
  };

  get icon() { return 'fa fa-toggle-on' }
}
module.exports = E1743
