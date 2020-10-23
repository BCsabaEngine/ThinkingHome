const GenericDevice = require('./GenericDevice')
const { Entity } = require('../../Entity')
const DeviceEvent = require('../../../models/DeviceEvent')

class E1743Entity extends Entity {
  publics = ['lastpresstime'];
  emits = {
    on: 'entity',
    off: 'entity',
    hold_up: 'entity',
    hold_down: 'entity',
    hold_release: 'entity'
  };

  lastpresstime = null;
  DoAction(mode) {
    this.lastpresstime = new Date().getTime()
    switch (mode) {
      case 'on':
        DeviceEvent.InsertSync(this.device.id, this.code, 'on')
        this.emit('on', this)
        break
      case 'off':
        DeviceEvent.InsertSync(this.device.id, this.code, 'off')
        this.emit('off', this)
        break
      case 'brightness_move_up':
        DeviceEvent.InsertSync(this.device.id, this.code, 'hold_up')
        this.emit('hold_up', this)
        break
      case 'brightness_move_down':
        DeviceEvent.InsertSync(this.device.id, this.code, 'hold_down')
        this.emit('hold_down', this)
        break
      case 'brightness_stop':
        DeviceEvent.InsertSync(this.device.id, this.code, 'hold_release')
        this.emit('hold_release', this)
        break
      default:
        break
    }
  }
}

class E1743 extends GenericDevice {
  ProcessActionObj(actionobj) { this.entities.pushbutton.DoAction(actionobj.action) }

  entities = {
    pushbutton: new E1743Entity(this, 'pushbutton', 'Push button', 'fa fa-toogle-on')
  };

  get icon() { return 'fa fa-toggle-on' }
}
module.exports = E1743
