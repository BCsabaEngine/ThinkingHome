const dayjs = require('dayjs')
const Thinking = require('./Thinking')

const lastircodecount = 5

class ThBlitzwolfIR extends Thinking {
  get icon() { return 'fa fa-rss' }
  entities = {};
  setting = {
    ircode1: '',
    toDisplayList: function () {
      const result = {}
      if (this.thinking_configlasttime) {
        result.lastconfig = {
          type: 'label',
          title: 'Last config time',
          value: dayjs(this.thinking_configlasttime).fromNow()
        }
      }
      result.sendconfig = {
        type: 'button',
        title: 'Send config to device',
        value: 'Push now',
        onexecute: function () { this.SendConfig() }.bind(this)
      }
      for (let i = 1; i <= 1; i++) {
        result[`ircode${i}`] = {
          type: 'text',
          title: `IR code ${i}`,
          value: this.setting[`ircode${i}`],
          displayvalue: function () { return this.setting[`ircode${i}`] || '' }.bind(this)(),
          error: false,
          canclear: true
        }
      }
      return result
    }.bind(this),
    toTitle: function () { return this.constructor.name }.bind(this),
    toSubTitle: function () { return '' }
  };

  lastircodes = [];
  GetStatusInfos() {
    const result = super.GetStatusInfos()
    if (this.lastircodes.length) {
      result.push({ device: this, message: '' })
      result.push({ device: this, message: 'Last IR codes by this device' })
      for (const ircode of this.lastircodes) { result.push({ device: this, message: '', value: ircode }) }
    }
    return result
  }

  CollectConfigToSend() {
    const result = []
    for (let i = 1; i <= 10; i++) {
      const irx = this.setting[`ircode${i}`]
      if (irx) { result.push({ name: `IR.${irx}`, value: irx }) }
    }
    return result
  }

  async Start() {
    await super.Start()
  }

  SendIr(ircode) {
    this.SendCmd('ircode', ircode)
    return true
  }

  ProcessMessage(topic, message) {
    if (super.ProcessMessage(topic, message)) { return true }

    if (topic.match(`^event/${this.GetTopic()}/ir(code)?$`)) {
      const ircode = message

      global.runningContext.irInterCom.IrReceived(this.name, ircode)

      this.lastircodes.push(ircode)
      while (this.lastircodes.length > lastircodecount) { this.lastircodes = this.lastircodes.slice(1) }
      global.wss.BroadcastToChannel(`device_${this.name}`)

      return true
    }

    return false
  }

  ProcessMessageObj(topic, messageobj) {
    if (super.ProcessMessageObj(topic, messageobj)) { return true }

    return false
  }
}
module.exports = ThBlitzwolfIR
