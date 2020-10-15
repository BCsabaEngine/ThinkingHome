const IrSender = require('./IrSender')
const { PushButtonEntity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

class IrButtonSequence extends IrSender {
  setting = {
    handlerdevice: null,
    ircode1: '',
    ircode2: '',
    ircode3: '',
    ircode4: '',
    latency: 1500,
    toDisplayList: function () {
      const result = {}

      const receivers = global.runningContext.irInterCom.GetReceiverDevices()

      const devicelist = {}
      for (const device of receivers) { devicelist[device.id] = device.name }
      result.handlerdevice = {
        type: 'select',
        title: 'Handler device',
        value: this.setting.handlerdevice,
        displayvalue: function () {
          if (this.setting.handlerdevice) {
            const owned = receivers.find(d => d.id === Number(this.setting.handlerdevice))
            if (owned) { return owned.name }
          }
          return ''
        }.bind(this)(),
        lookup: JSON.stringify(devicelist).replace(/["]/g, "'"),
        error: !this.setting.handlerdevice,
        canclear: false
      }
      result.ircode1 = {
        type: 'text',
        title: 'IR code 1st',
        value: this.setting.ircode1,
        error: !this.setting.ircode1,
        canclear: false
      }
      result.ircode2 = {
        type: 'text',
        title: 'IR code 2nd',
        value: this.setting.ircode2,
        error: !this.setting.ircode2,
        canclear: false
      }
      result.ircode3 = {
        type: 'text',
        title: 'IR code 3rd',
        value: this.setting.ircode3,
        error: false,
        canclear: true
      }
      result.ircode4 = {
        type: 'text',
        title: 'IR code 4th',
        value: this.setting.ircode4,
        error: false,
        canclear: true
      }
      const latencyintervallist = { 1000: '1000 ms', 1500: '1500 ms', 2000: '2000 ms', 2500: '2500 ms' }
      result.latency = {
        type: 'select',
        title: 'Delay time',
        value: this.setting.latency,
        displayvalue: this.setting.latency + ' ms',
        lookup: JSON.stringify(latencyintervallist).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }
      return result
    }.bind(this),
    toTitle: function () { return 'Sequence' },
    toSubTitle: function () {
      const result = []
      if (this.setting.ircode1) { result.push('1') }
      if (this.setting.ircode2) { result.push('2') }
      if (this.setting.ircode3) { result.push('3') }
      if (this.setting.ircode3) { result.push('4') }
      return result.join(' + ') + ` (${this.setting.latency} ms)`
    }.bind(this)
  };

  get icon() { return this.setting.icon || 'fa fa-angle-double-right' }
  entities = {
    sequence: new PushButtonEntity(this, 'sequence', 'Sequence', 'fa fa-dot-circle')
      .AddAction(new ButtonAction(this, 'press', 'Press', 'fa fa-rss', function () { this.device.entities.sequence.DoPress() }))

  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.handlerdevice) result.push({ device: this, error: true, message: 'Handler device not set' })
    if (!this.setting.ircode1) result.push({ device: this, error: true, message: 'IR code 1st not set' })
    if (!this.setting.ircode2) result.push({ device: this, error: true, message: 'IR code 2nd not set' })
    return result
  }

  IsHandledBy(handlerdevice) { return Number(this.setting.handlerdevice) === handlerdevice }
  CollectConfigToSend(handlerdevice) {
    const result = []

    if (Number(this.setting.handlerdevice) === handlerdevice) {
      if (this.setting.ircode1) { result.push(this.setting.ircode1) }
      if (this.setting.ircode2) { result.push(this.setting.ircode2) }
      if (this.setting.ircode3) { result.push(this.setting.ircode3) }
      if (this.setting.ircode4) { result.push(this.setting.ircode4) }
    }

    return result
  }

  lastarrived = 0
  seqstep = 1
  ReceiveIrCode(handlerdevice, ircode) {
    if (Number(this.setting.handlerdevice) !== handlerdevice) { return false }

    const now = new Date().getTime()
    if (now - this.lastarrived > this.setting.latency) { this.seqstep = 1 }

    if (this.seqstep === 1 && ircode === this.setting.ircode1) {
      this.seqstep++
    } else
      if (this.seqstep === 2 && ircode === this.setting.ircode2) {
        if (!this.setting.ircode3) {
          this.entities.sequence.DoPress()
          this.seqstep = 1
        } else { this.seqstep++ }
      } else
        if (this.seqstep === 3 && ircode === this.setting.ircode3) {
          if (!this.setting.ircode4) {
            this.entities.sequence.DoPress()
            this.seqstep = 1
          } else { this.seqstep++ }
        } else
          // eslint-disable-next-line no-magic-numbers
          if (this.seqstep === 4 && ircode === this.setting.ircode4) {
            this.entities.sequence.DoPress()
            this.seqstep = 1
          }

    this.lastarrived = now
    return ircode === this.setting.ircode1 || ircode === this.setting.ircode2 || ircode === this.setting.ircode3
  }
}
module.exports = IrButtonSequence
