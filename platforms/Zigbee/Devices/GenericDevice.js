const dayjs = require('dayjs')
const ZigbeeDevice = require('../ZigbeeDevice')
const { TelemetryEntity } = require('../../Entity')
const { NumericValueGaugeBoardItem } = require('../../BoardItem')

const batterywarninglevel = 20
const batteryerrorlevel = 10

class GenericDevice extends ZigbeeDevice {
  sensors = [];

  InitEntities() {
    for (const sensor of this.sensors) {
      this.entities[sensor.code] = new TelemetryEntity(this, sensor.code, sensor.name, sensor.icon)
        .InitUnit(sensor.unit)
        .InitLastValue()
        .SetSmooth()
        .AddBoardItem(new NumericValueGaugeBoardItem())
      if (sensor.minvalue) this.entities[sensor.code].InitMinValue(sensor.minvalue)
      if (sensor.maxvalue) this.entities[sensor.code].InitMaxValue(sensor.maxvalue)
    }
    this.LinkUpEntities()
  }

  setting = {
    topic: '',
    toDisplayList: function () {
      const result = {}
      result.topic = {
        type: 'text',
        title: 'MQTT topic',
        value: this.setting.topic,
        displayvalue: function () { return this.setting.topic || `${this.name} (default)` }.bind(this)(),
        error: false,
        canclear: true
      }
      return result
    }.bind(this),
    toTitle: function () { return this.constructor.name }.bind(this),
    toSubTitle: function () { return this.setting.topic || `${this.name} (default)` }.bind(this)
  };

  entities = {};
  starttime = new Date().getTime();
  zigbeeLastTime = '';
  zigbeeLinkQuality = '';
  zigbeeBatteryPercent = '';
  zigbeeVoltage = '';
  GetStatusInfos() {
    const result = []
    // if (!this.zigbeeLastTime && (new Date().getTime() - this.starttime) > 3 * 60 * 1000) { result.push({ device: this, error: true, message: 'No info, maybe offline? ' }) }
    if (this.zigbeeLastTime) { result.push({ device: this, message: 'Info time', value: this.zigbeeLastTime ? dayjs(this.zigbeeLastTime).fromNow() : '' }) }
    if (this.zigbeeLinkQuality) { result.push({ device: this, message: 'Link quality', value: `${this.zigbeeLinkQuality} lqi` }) }
    if (this.zigbeeBatteryPercent) {
      result.push({
        device: this,
        warning: this.zigbeeBatteryPercent < batterywarninglevel && this.zigbeeBatteryPercent >= batteryerrorlevel,
        error: this.zigbeeBatteryPercent < batteryerrorlevel,
        message: 'Battery',
        value: `${this.zigbeeBatteryPercent} %`
      })
    }
    if (this.zigbeeVoltage) { result.push({ device: this, message: 'Voltage', value: `${this.zigbeeVoltage} mV` }) }
    return result
  }

  async Start() {
    await super.Start()
    this.InitEntities()
  }

  GetTopic() {
    return (this.setting.topic || this.name).toLowerCase()
  }

  SendCmnd(command, message) {
    const topic = `cmnd/${this.GetTopic()}/${command}`
    // console.log([topic, message]);
    this.platform.SendMessage(topic, message)
  }

  ProcessMessage(topic, message) {
    if (topic === this.GetTopic()) return true
    return false
  }

  ProcessActionObj(action) { }

  ProcessMessageObj(topic, messageobj) {
    if (topic === this.GetTopic()) {
      this.zigbeeLastTime = new Date().getTime()
      if (messageobj.linkquality) this.zigbeeLinkQuality = messageobj.linkquality
      if (messageobj.battery) this.zigbeeBatteryPercent = messageobj.battery
      if (messageobj.voltage) this.zigbeeVoltage = messageobj.voltage

      for (const sensor of this.sensors) {
        let value = messageobj[sensor.code]
        if (value !== undefined) {
          if (sensor.converter) value = sensor.converter(value)
          this.entities[sensor.code].SetValue(value)
        }
      }

      // console.log(messageobj)
      if (messageobj.action) this.ProcessActionObj(messageobj)

      return true
    }

    return false
  }
}
module.exports = GenericDevice
