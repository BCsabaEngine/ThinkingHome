const YeelightDevice = require('../YeelightDevice')
const { TelemetryEntity } = require('../../Entity')
const { NumericValueGaugeBoardItem } = require('../../BoardItem')

class GenericDevice extends YeelightDevice {
  //  sensors = [];

  // InitEntities() {
  //   for (const sensor of this.sensors) {
  //     this.entities[sensor.code] = new TelemetryEntity(this, sensor.code, sensor.name, sensor.icon)
  //       .InitUnit(sensor.unit)
  //       .InitLastValue()
  //       .SetSmooth()
  //       .AddBoardItem(new NumericValueGaugeBoardItem())
  //     if (sensor.minvalue !== undefined) this.entities[sensor.code].InitMinValue(sensor.minvalue)
  //     if (sensor.maxvalue !== undefined) this.entities[sensor.code].InitMaxValue(sensor.maxvalue)
  //   }
  //   this.LinkUpEntities()
  // }

  setting = {
    host: '',
    toDisplayList: function () {
      const result = {}
      result.host = {
        type: 'text',
        title: 'Host/IP',
        value: this.setting.host,
        error: !this.setting.host,
        canclear: false
      }
      return result
    }.bind(this),
    toTitle: function () { return this.constructor.name }.bind(this),
    toSubTitle: function () { return this.setting.host }.bind(this)
  };

  entities = {};
  GetStatusInfos() {
    const result = []
    return result
  }

  async Start() {
    await super.Start()
    // this.InitEntities()
  }

  // GetTopic() {
  //   return (this.setting.topic || this.name).toLowerCase()
  // }

  // SendCmnd(command, message) {
  //   const topic = `cmnd/${this.GetTopic()}/${command}`
  //   // console.log([topic, message]);
  //   this.platform.SendMessage(topic, message)
  // }

  // ProcessMessage(topic, message) {
  //   if (topic === this.GetTopic()) return true
  //   return false
  // }

  // ProcessActionObj(action) { }

  // ProcessMessageObj(topic, messageobj) { }
}
module.exports = GenericDevice
