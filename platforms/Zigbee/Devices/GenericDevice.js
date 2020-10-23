const dayjs = require('dayjs')
const ZigbeeDevice = require('../ZigbeeDevice')
const { NumericValueGaugeEntity /*, ButtonEntity */ } = require('../../Entity')
// const { ButtonAction } = require('../../Action')
const { NumericValueGaugeBoardItem } = require('../../BoardItem')

class GenericDevice extends ZigbeeDevice {
  sensors = [];
  actions = {};

  InitEntities() {
    for (const sensor of this.sensors) {
      this.entities[sensor.code] = new NumericValueGaugeEntity(this, sensor.code, sensor.name, sensor.icon)
        .InitUnit(sensor.unit)
        .AddBoardItem(new NumericValueGaugeBoardItem())
      if (sensor.minvalue) this.entities[sensor.code].InitMinValue(sensor.minvalue)
      if (sensor.maxvalue) this.entities[sensor.code].InitMaxValue(sensor.maxvalue)
    }
    // for (let i = 1; i <= this.setting.buttoncount; i++) {
    //   this.entities[`button${i}`] = new ButtonEntity(this, `button${i}`, `Button${i}`, 'fa fa-dot-circle')
    //     .AddAction(new ButtonAction(this, 'push', 'Push', 'fa fa-dot-circle', function () { this.entity.DoPress(1) }))
    // }
    // .AddBoardItem(new PushBoardItem('push'))
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
    if (!this.zigbeeLastTime && (new Date().getTime() - this.starttime) > 3 * 60 * 1000) { result.push({ device: this, error: true, message: 'No info, maybe offline? ' }) }
    if (this.zigbeeLastTime) { result.push({ device: this, message: 'Info time', value: this.zigbeeLastTime ? dayjs(this.zigbeeLastTime).fromNow() : '' }) }
    if (this.zigbeeLinkQuality) { result.push({ device: this, message: 'Link quality', value: `${this.zigbeeLinkQuality} lqi` }) }
    if (this.zigbeeBatteryPercent) { result.push({ device: this, message: 'Battery', value: `${this.zigbeeBatteryPercent} %` }) }
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

      return true
    }

    return false
  }
}
module.exports = GenericDevice
