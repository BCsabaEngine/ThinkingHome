const GenericDevice = require('./GenericDevice')
const { Entity } = require('../../Entity')
const DeviceEvent = require('../../../models/DeviceEvent')

class E1744Entity extends Entity {
  publics = ['lastpresstime'];
  emits = {
    left: 'entity',
    right: 'entity',
    click: 'entity',
    doubleclick: 'entity',
    tripleclick: 'entity'
  };

  lastpresstime = null;
  DoAction(mode) {
    this.lastpresstime = new Date().getTime()
    switch (mode) {
      case 'rotate_left':
        DeviceEvent.InsertSync(this.device.id, this.code, 'left')
        this.emit('left', this)
        break
      case 'rotate_right':
        DeviceEvent.InsertSync(this.device.id, this.code, 'right')
        this.emit('right', this)
        break
      case 'play_pause':
        DeviceEvent.InsertSync(this.device.id, this.code, 'click')
        this.emit('click', this)
        break
      case 'skip_forward':
        DeviceEvent.InsertSync(this.device.id, this.code, 'doubleclick')
        this.emit('doubleclick', this)
        break
      case 'skip_backward':
        DeviceEvent.InsertSync(this.device.id, this.code, 'tripleclick')
        this.emit('tripleclick', this)
        break
      default:
        break
    }
  }
}

class E1744 extends GenericDevice {
  ProcessActionObj(actionobj) { this.entities.rotator.DoAction(actionobj.action) }

  entities = {
    rotator: new E1744Entity(this, 'rotator', 'Rotator', 'fa fa-tablets')
  };

  get icon() { return 'fa fa-tablets' }
}
module.exports = E1744
