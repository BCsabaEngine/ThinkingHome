const GenericDevice = require('./GenericDevice')
const { EventEntity } = require('../../Entity')

class ColorLamp extends GenericDevice {
  // ProcessActionObj(actionobj) {
  //   switch (actionobj.action) {
  //     case 'wakeup':
  //       this.entities.cube.DoEvent('wakeup')
  //       break
  //     case 'shake':
  //       this.entities.cube.DoEvent('shake')
  //       break
  //     case 'rotate_left':
  //       this.entities.cube.DoEvent('rotateleft', Math.round(actionobj.angle))
  //       break
  //     case 'rotate_right':
  //       this.entities.cube.DoEvent('rotateright', Math.round(actionobj.angle))
  //       break
  //     case 'flip90':
  //     case 'flip180':
  //       this.entities.cube.DoEvent(actionobj.action, actionobj.side)
  //       break
  //     case 'slide':
  //       this.entities.cube.DoEvent('slide')
  //       break
  //     default:
  //       break
  //   }
  // }

  // entities = {
  //   cube: new EventEntity(this, 'cube', 'Cube', 'fa fa-cube')
  //     .InitEvents(['wakeup', 'shake', 'slide'])
  //     .AddEventWithEmit('rotateleft', ['angle'])
  //     .AddEventWithEmit('rotateright', ['angle'])
  //     .AddEventWithEmit('flip90', ['side'])
  //     .AddEventWithEmit('flip180', ['side'])
  // };
}
module.exports = ColorLamp
