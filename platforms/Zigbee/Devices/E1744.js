const GenericDevice = require('./GenericDevice')

class E1744 extends GenericDevice {
  actions = {
    rotate_left: 'left',
    rotate_right: 'right',
    play_pause: 'click',
    skip_forward: 'double',
    skip_backward: 'triple'
  };

  get icon() { return 'fa fa-tablets' }
}
module.exports = E1744
