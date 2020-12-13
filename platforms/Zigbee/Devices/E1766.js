const GenericDevice = require('./GenericDevice')
const { EventEntity } = require('../../Entity')

class E1766 extends GenericDevice {
  lastdirection = ''

  ProcessSpecificMessageObj(messageobj) {
    switch (messageobj.action) {
      case 'open':
        this.entities.pushbutton.DoEvent('open')
        this.lastdirection = 'open'
        break
      case 'close':
        this.entities.pushbutton.DoEvent('close')
        this.lastdirection = 'close'
        break
      case 'stop':
        this.entities.pushbutton.DoEvent('stop')
        switch (this.lastdirection) {
          case 'open':
            this.entities.pushbutton.DoEvent('openstop')
            break
          case 'close':
            this.entities.pushbutton.DoEvent('closestop')
            break
          default:
            break
        }
        this.lastdirection = ''
        break
      default:
        break
    }
  }

  entities = {
    pushbutton: new EventEntity(this, 'pushbutton', 'Push button', 'fa fa-toggle-on')
      .InitEvents(['open', 'close', 'stop', 'openstop', 'closestop'])
  };

  get icon() { return 'fa fa-toggle-on' }
}
module.exports = E1766
