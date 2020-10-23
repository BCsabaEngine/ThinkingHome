const GenericDevice = require('./GenericDevice')
const { Entity } = require('../../Entity')
const DeviceEvent = require('../../../models/DeviceEvent')

class AqaraCubeEntity extends Entity {
  publics = ['lastpresstime'];
  emits = {
    wakeup: 'entity',
    shake: 'entity',
    rotateleft: ['entity', 'angle'],
    rotateright: ['entity', 'angle'],
    flip90: ['entity', 'side'],
    flip180: ['entity', 'side'],
    slide: 'entity'
  };

  lastpresstime = null;
  DoAction(actionobj) {
    this.lastpresstime = new Date().getTime()
    switch (actionobj.action) {
      case 'wakeup':
        DeviceEvent.InsertSync(this.device.id, this.code, 'wakeup')
        this.emit('wakeup', this)
        break
      case 'shake':
        DeviceEvent.InsertSync(this.device.id, this.code, 'shake')
        this.emit('shake', this)
        break
      case 'rotate_left':
        DeviceEvent.InsertSync(this.device.id, this.code, 'rotateleft')
        this.emit('rotateleft', this, actionobj.angle)
        break
      case 'rotate_right':
        DeviceEvent.InsertSync(this.device.id, this.code, 'rotateright')
        this.emit('rotateright', this, actionobj.angle)
        break
      case 'flip90':
      case 'flip180':
        DeviceEvent.InsertSync(this.device.id, this.code, actionobj.action)
        this.emit(actionobj.action, this, actionobj.side)
        break
      case 'slide':
        DeviceEvent.InsertSync(this.device.id, this.code, 'slide')
        this.emit('slide', this)
        break
      default:
        break
    }
  }
}

class AqaraCube extends GenericDevice {
  ProcessActionObj(actionobj) { this.entities.cube.DoAction(actionobj) }

  entities = {
    cube: new AqaraCubeEntity(this, 'cube', 'Cube', 'fa fa-cube')
  };

  get icon() { return 'fa fa-cube' }
}
module.exports = AqaraCube
