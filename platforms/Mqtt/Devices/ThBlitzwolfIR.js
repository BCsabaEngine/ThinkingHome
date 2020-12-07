const dayjs = require('dayjs')
const arrayUtils = require('../../../lib/arrayUtils')
const Thinking = require('./Thinking')

const lastircodecount = 5

class ThBlitzwolfIR extends Thinking {
  get icon() { return 'fa fa-rss' }
  entities = {};
  setting = {
    toDisplayList: function () {
      const result = {}
      if (this.thinking_configlasttime) {
        result.lastconfig = {
          type: 'label',
          title: __('Last config time'),
          value: dayjs(this.thinking_configlasttime).fromNow()
        }
      }
      result.sendconfig = {
        type: 'button',
        title: __('Send config to device'),
        value: __('Push now'),
        onexecute: function () { this.SendConfig() }.bind(this)
      }
      result.startdiscovery = {
        type: 'button',
        title: __('IR discovery mode'),
        value: __('Start'),
        onexecute: function () { this.SendCmd('irdiscovery', '1') }.bind(this)
      }
      result.finishdiscovery = {
        type: 'button',
        title: __('IR discovery mode'),
        value: __('Finish'),
        onexecute: function () { this.SendCmd('irdiscovery', '0') }.bind(this)
      }
      return result
    }.bind(this),
    toTitle: function () { return this.constructor.name }.bind(this),
    toSubTitle: function () { return '' }
  };

  lastircodes = [];
  GetStatusInfos() {
    const result = super.GetStatusInfos()

    const handleddevices = global.runningContext.irInterCom.GetDevicesHandledBy(this.id)
    arrayUtils.sortByProperty(handleddevices, 'name')
    if (handleddevices.length) {
      result.push({ device: this, message: '' })
      result.push({ device: this, message: __('Handled devices') })
      for (const handleddevice of handleddevices) { result.push({ message: '', value: handleddevice.name }) }
    }

    if (this.lastircodes.length) {
      result.push({ device: this, message: '' })
      result.push({ device: this, message: __('Last IR codes by this device') })
      for (const ircode of this.lastircodes) { result.push({ device: this, message: '', value: ircode }) }
    }
    return result
  }

  CollectConfigToSend() {
    const result = []
    for (const handleddevice of global.runningContext.irInterCom.GetDevicesHandledBy(this.id, true, false)) {
      for (const ircode of handleddevice.CollectConfigToSend(this.id)) {
        if (ircode) { result.push({ name: `IR.${ircode}`, value: ircode }) }
      }
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

    if (topic.match(`^event/${this.GetTopic()}/ir(code|discovery)?$`)) {
      const ircode = message

      global.runningContext.irInterCom.IrReceived(this.id, ircode)

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
