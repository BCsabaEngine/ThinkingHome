const RaspberryPiDevice = require('../RaspberryPiDevice')
const si = require('systeminformation')
const { TelemetryEntity } = require('../../Entity')
const { NumericValueGaugeBoardItem } = require('../../BoardItem')

class RaspberryPiCpu extends RaspberryPiDevice {
  get icon() { return 'fa fa-microchip' }
  entities = {
    temp: new TelemetryEntity(this, 'temp', 'Temperature', 'fa fa-thermometer-half')
      .InitUnit('°C')
      // eslint-disable-next-line no-magic-numbers
      .InitMinMaxValue(30, 70)
      .SetSmooth()
      .AddBoardItem(new NumericValueGaugeBoardItem()),
    loadpercent: new TelemetryEntity(this, 'loadpercent', 'Load percent', 'fa fa-chart-area')
      .InitByPercent()
      .SetSmooth()
      .AddBoardItem(new NumericValueGaugeBoardItem())
  };

  // GetStatusInfos() { }
  Tick(seconds) {
    si
      .cpuTemperature()
      .then(function (data) {
        const temp = data.main
        if (temp > 0) { this.entities.temp.SetValue(Math.round(temp)) }
      }.bind(this))

    si
      .currentLoad()
      .then(function (data) {
        const currentload = data.currentload
        if (currentload > 0) { this.entities.loadpercent.SetValue(Math.round(currentload)) }
      }.bind(this))
    // console.log(this.entities.temp.toString() + ": " + this.entities.temp.toGaugeValueString() + " " + this.entities.temp.toValueColor());
  }
}
module.exports = RaspberryPiCpu
