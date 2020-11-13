const GenericDevice = require('./GenericDevice')
const { EventEntity } = require('../../Entity')

class AqaraCube extends GenericDevice {
  ProcessSpecificMessageObj(messageobj) {
    switch (messageobj.action) {
      case 'wakeup':
        this.entities.cube.DoEvent('wakeup')
        break
      case 'shake':
        this.entities.cube.DoEvent('shake')
        break
      case 'rotate_left':
        this.entities.cube.DoEvent('rotateleft', Math.round(messageobj.angle))
        break
      case 'rotate_right':
        this.entities.cube.DoEvent('rotateright', Math.round(messageobj.angle))
        break
      case 'flip90':
      case 'flip180':
        this.entities.cube.DoEvent(messageobj.action, messageobj.side)
        break
      case 'slide':
        this.entities.cube.DoEvent('slide')
        break
      default:
        break
    }
  }

  entities = {
    cube: new EventEntity(this, 'cube', 'Cube', 'fa fa-cube')
      .InitEvents(['wakeup', 'shake', 'slide'])
      .AddEventWithEmit('rotateleft', ['angle'])
      .AddEventWithEmit('rotateright', ['angle'])
      .AddEventWithEmit('flip90', ['side'])
      .AddEventWithEmit('flip180', ['side'])
  };

  get icon() { return 'fa fa-cube' }
}
module.exports = AqaraCube
