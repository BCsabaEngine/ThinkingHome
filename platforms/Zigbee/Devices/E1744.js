const GenericDevice = require('./GenericDevice')
const { EventEntity } = require('../../Entity')

class E1744 extends GenericDevice {
  ProcessActionObj(actionobj) {
    switch (actionobj.action) {
      case 'rotate_left':
        this.entities.rotator.DoEvent('left')
        break
      case 'rotate_right':
        this.entities.rotator.DoEvent('right')
        break
      case 'play_pause':
        this.entities.rotator.DoEvent('click')
        break
      case 'skip_forward':
        this.entities.rotator.DoEvent('doubleclick')
        break
      case 'skip_backward':
        this.entities.rotator.DoEvent('tripleclick')
        break
      default:
        break
    }
  }

  entities = {
    rotator: new EventEntity(this, 'rotator', 'Rotator', 'fa fa-tablets')
      .InitEvents(['left', 'right', 'click', 'doubleclick', 'tripleclick'])
  };

  get icon() { return 'fa fa-tablets' }
}
module.exports = E1744
