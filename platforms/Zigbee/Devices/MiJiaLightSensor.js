const GenericDevice = require('./GenericDevice')

class MiJiaLightSensor extends GenericDevice {
  sensors = ['illuminance', 'illuminance_lux'];

  get icon() { return 'fa fa-low-vision' }
}
module.exports = MiJiaLightSensor
