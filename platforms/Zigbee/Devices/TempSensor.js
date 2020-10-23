const GenericDevice = require('./GenericDevice')

class TempSensor extends GenericDevice {
  sensors = [
    { code: 'temperature', name: 'Temperature', unit: '°C', icon: 'fa fa-thermometer-half', minvalue: 0, maxvalue: 40, converter: (value) => Math.round(value * 2) / 2 },
    { code: 'humidity', name: 'Humidity', unit: '%', icon: 'fa fa-wind', minvalue: 0, maxvalue: 100, converter: (value) => Math.round(value) }
  ];

  get icon() { return 'fa fa-thermometer-half' }
}
module.exports = TempSensor
