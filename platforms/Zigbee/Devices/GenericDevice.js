const dayjs = require('dayjs')
const ZigbeeDevice = require('../ZigbeeDevice')
const { BoolStateEntity, ButtonEntity } = require('../../Entity')
const { ButtonAction } = require('../../Action')
const { ToggleBoardItem } = require('../../BoardItem')

class GenericDevice extends ZigbeeDevice {
  sensors = [];
  actions = {};

  InitEntities() {
    // for (let i = 1; i <= this.setting.powercount; i++) {
    //   this.entities[`power${i}`] = new BoolStateEntity(this, `power${i}`, `Power${i}`, 'fa fa-toggle-on')
    //     .InitStateIcons('fa fa-toggle-off', 'fa fa-toggle-on')
    //     .AddAction(new ButtonAction(this, 'toggle', 'Toggle', 'fa fa-toggle-on', function () { this.device.SendCmnd(`power${i}`, 'toggle') }))
    //     .AddAction(new ButtonAction(this, 'switchon', 'Switch on', 'fa fa-toggle-on', function () { this.device.SendCmnd(`power${i}`, 'on') }))
    //     .AddAction(new ButtonAction(this, 'switchoff', 'Switch off', 'fa fa-toggle-off', function () { this.device.SendCmnd(`power${i}`, 'off') }))
    //     .AddBoardItem(new ToggleBoardItem())
    // }
    // for (let i = 1; i <= this.setting.buttoncount; i++) {
    //   this.entities[`button${i}`] = new ButtonEntity(this, `button${i}`, `Button${i}`, 'fa fa-dot-circle')
    //     .AddAction(new ButtonAction(this, 'push', 'Push', 'fa fa-dot-circle', function () { this.entity.DoPress(1) }))
    // }
    // .AddBoardItem(new PushBoardItem('push'))
    this.LinkUpEntities()
  }

  setting = {
    topic: '',
    icon: '',
    toDisplayList: function () {
      const result = {}
      result.topic = {
        type: 'text',
        title: 'MQTT topic',
        value: this.setting.topic,
        displayvalue: function () { return this.setting.topic || `${this.name.replace('ieee_', '')} (default)` }.bind(this)(),
        error: false,
        canclear: true
      }
      result.icon = {
        type: 'text',
        title: 'Device icon',
        value: this.setting.icon,
        displayvalue: function () { return this.setting.icon || 'fa fa-hive (default)' }.bind(this)(),
        error: false,
        canclear: true
      }
      return result
    }.bind(this),
    toTitle: function () { return this.constructor.name }.bind(this),
    toSubTitle: function () {
      const result = []
      // TODO Show first sensor data
      return result.join('+')
    }.bind(this)
  };

  get icon() { return this.setting.icon || 'fa fa-hive' }
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
    return (this.setting.topic || this.name.replace('ieee_', '')).toLowerCase()
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

      console.log(messageobj)
      return true
    }

    return false
  }
}
module.exports = GenericDevice
