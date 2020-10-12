const dayjs = require('dayjs')
const timeUtils = require('../../../lib/timeUtils')
const stringUtils = require('../../../lib/stringUtils')
const MqttDevice = require('../MqttDevice')

const maxlatenceminutes = 30

class Thinking extends MqttDevice {
  get icon() { return 'fa fa-code-branch' }
  entities = {};
  starttime = new Date().getTime();
  thinkingTime = '';
  thinkingChipID = '';
  thinkingFirmware = '';
  thinkingUptime = '';
  thinkingFreemem = '';
  thinkingIPAddress = '';
  thinkingWifiSSId = '';
  thinkingWifiRSSI = 0;
  GetStatusInfos() {
    const result = []
    if ((!this.thinkingTime && (new Date().getTime() - this.starttime) > 10 * 1000) || (this.thinkingTime && (new Date().getTime() - this.thinkingTime) > maxlatenceminutes * 60 * 1000)) { result.push({ device: this, error: true, message: 'No info, maybe offline? ' }) }
    if (this.thinkingTime) { result.push({ device: this, message: 'Info time', value: this.thinkingTime ? dayjs(this.thinkingTime).fromNow() : '' }) }
    if (this.thinkingChipID) { result.push({ device: this, message: 'Chip IP', value: this.thinkingChipID }) }
    if (this.thinkingFirmware) { result.push({ device: this, message: 'Firmware', value: this.thinkingFirmware }) }
    if (this.thinkingUptime) { result.push({ device: this, message: 'Uptime', value: timeUtils.secondsToTime(this.thinkingUptime) }) }
    if (this.thinkingFreemem) { result.push({ device: this, message: 'Freemem', value: stringUtils.thousand(this.thinkingFreemem) + ' bytes' }) }
    if (this.thinkingIPAddress) { result.push({ device: this, message: 'Wifi IP', value: this.thinkingIPAddress }) }
    if (this.thinkingWifiSSId) { result.push({ device: this, message: 'Wifi SSID', value: this.thinkingWifiSSId }) }
    if (this.thinkingWifiRSSI) { result.push({ device: this, message: 'Wifi RSSI', value: this.thinkingWifiRSSI }) }
    return result
  }

  async Start() {
    await super.Start()
    this.platform.SendMessage(`ping/${this.GetTopic()}`, '')
  }

  thinkingConfiglasttime = 0;
  CollectConfigToSend() { return [] }
  SendConfig() {
    const now = new Date()
    const timevalue = Math.round(now.getTime() / 1000) - now.getTimezoneOffset() * 60

    const items = []
    items.push({ topic: `cfg/${this.GetTopic()}/time`, message: timevalue.toString() })
    items.push({ topic: `cfg/${this.GetTopic()}/reset`, message: '' })
    const configtosend = this.CollectConfigToSend()
    if (configtosend && configtosend.length) {
      for (const cts of configtosend) {
        if (cts.name) { items.push({ topic: `cfg/${this.GetTopic()}/set`, message: JSON.stringify({ name: cts.name, value: cts.value }) }) }
      }
      items.push({ topic: `cfg/${this.GetTopic()}/commit`, message: '' })
    }

    const MQTTDELAY_INIT = Math.floor(Math.random() * 1000)
    const MQTTDELAY_STEP = Math.floor(Math.random() * 1000)
    let index = 1
    for (const item of items) {
      setTimeout(function () {
        this.platform.SendMessage(item.topic, item.message)
        logger.debug(`[Thinking] Config message sent to ${item.topic}: ${item.message}`)
      }.bind(this), MQTTDELAY_INIT + index * MQTTDELAY_STEP)
      index++
    }

    this.thinkingConfiglasttime = now.getTime()

    global.wss.BroadcastToChannel(`device_${this.name}`)
  }

  GetTopic() { return (this.name).toLowerCase() }
  SendMqtt(prefix, postfix, message) {
    if (prefix) {
      if (postfix) { this.platform.SendMessage(`${prefix}/${this.GetTopic()}/${postfix}`, message) } else { this.platform.SendMessage(`${prefix}/${this.GetTopic()}`, message) }
    }
  }

  SendCmd(command, message) {
    this.SendMqtt('cmd', command, message)
  }

  ProcessMessage(topic, message) {
    if (topic.match(`^online/${this.GetTopic()}$`)) {
      this.SendConfig()
      return true
    }
    if (topic.match(`^cfg/${this.GetTopic()}/(time|set|reset|commit)`)) return true
    if (topic.match(`^ping/${this.GetTopic()}$`)) return true
    if (topic.match(`^cmd/${this.GetTopic()}`)) return true

    return false
  }

  ProcessMessageObj(topic, messageobj) {
    if (topic.match(`^sys/${this.GetTopic()}$`)) {
      this.thinkingChipID = messageobj.chipid
      this.thinking_Version = messageobj.firmware
      this.thinkingUptime = messageobj.uptime
      this.thinkingFreemem = messageobj.freemem
      this.thinkingIPAddress = messageobj.wifi.ip
      this.thinkingWifiSSId = messageobj.wifi.ssid
      this.thinkingWifiRSSI = messageobj.wifi.rssi

      this.thinkingTime = new Date().getTime()
      this.SendConfig()
      return true
    }
    if (topic.match(`^cfg/${this.GetTopic()}/(time|set|reset|commit)`)) return true

    return false
  }
}
module.exports = Thinking
