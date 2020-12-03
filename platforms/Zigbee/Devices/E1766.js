const GenericDevice = require('./GenericDevice')
const { EventEntity } = require('../../Entity')

class E1766 extends GenericDevice {
  ProcessSpecificMessageObj(messageobj) {
    switch (messageobj.action) {
      case 'open':
        this.entities.pushbutton.DoEvent('open')
        break
      case 'close':
        this.entities.pushbutton.DoEvent('close')
        break
      case 'stop':
        this.entities.pushbutton.DoEvent('stop')
        break
      default:
        break
    }
  }

  entities = {
    pushbutton: new EventEntity(this, 'pushbutton', 'Push button', 'fa fa-toggle-on')
      .InitEvents(['open', 'close', 'stop'])
  };

  get icon() { return 'fa fa-toggle-on' }
}
module.exports = E1766
