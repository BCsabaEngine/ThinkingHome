const GenericDevice = require('./GenericDevice')

class LightSensor extends GenericDevice {
  sensors = [
    { code: 'illuminance', name: 'Luminance', unit: '', icon: 'fa fa-low-vision', minvalue: 0, maxvalue: 100000 },
    { code: 'illuminance_lux', name: 'Lux', unit: 'lx', icon: 'fa fa-low-vision', minvalue: 0, maxvalue: 500 }
  ];

  get icon() { return 'fa fa-low-vision' }
}
module.exports = LightSensor
