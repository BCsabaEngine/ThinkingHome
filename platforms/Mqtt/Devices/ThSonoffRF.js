const dayjs = require('dayjs');
const Thinking = require('./Thinking');

class ThSonoffRF extends Thinking {
  get icon() { return "fa fa-broadcast-tower"; }
  entities = {};
  setting = {
    rfcode1: '',
    rfcode2: '',
    rfcode3: '',
    rfcode4: '',
    rfcode5: '',
    rfcode6: '',
    rfcode7: '',
    rfcode8: '',
    rfcode9: '',
    rfcode10: '',
    toDisplayList: function () {
      const result = {};
      if (this.thinking_configlasttime)
        result['lastconfig'] = {
          type: 'label',
          title: 'Last config time',
          value: dayjs(this.thinking_configlasttime).fromNow(),
        };
      result['sendconfig'] = {
        type: 'button',
        title: 'Send config to device',
        value: 'Push now',
        onexecute: function () { this.SendConfig(); }.bind(this),
      };
      for (let i = 1; i <= 10; i++)
        result[`rfcode${i}`] = {
          type: 'text',
          title: `RF code ${i}`,
          value: this.setting[`rfcode${i}`],
          displayvalue: function () { return this.setting[`rfcode${i}`] || ''; }.bind(this)(),
          error: false,
          canclear: true,
        };
      return result;

    }.bind(this),
    toTitle: function () { return this.constructor.name; }.bind(this),
    toSubTitle: function () { }.bind(this),
  };
  last5rfcode = [];
  GetStatusInfos() {
    const result = super.GetStatusInfos();
    if (this.last5rfcode.length) {
      result.push({ device: this, message: "" });
      result.push({ device: this, message: "Last RF codes by this device" });
      for (const rfcode of this.last5rfcode)
        result.push({ device: this, message: '', value: rfcode, });
    }
    return result;
  }
  CollectConfigToSend() {
    const result = [];
    for (let i = 1; i <= 10; i++) {
      const rfx = this.setting[`rfcode${i}`];
      if (rfx)
        result.push({ name: `RF.${rfx}`, value: rfx });
    }
    return result;
  }
  async Start() {
    await super.Start();
  }
  ProcessMessage(topic, message) {
    if (super.ProcessMessage(topic, message))
      return true;

    if (topic.match(`^event\/${this.GetTopic()}\/rf(code)?$`)) {
      const rfcode = message;

      runningContext.rfInterCom.RfReceived(rfcode);

      this.last5rfcode.push(rfcode);
      while (this.last5rfcode.length > 5)
        this.last5rfcode = this.last5rfcode.slice(1);
      wss.BroadcastToChannel(`device_${this.name}`);

      return true;
    }

    return false;
  }
  ProcessMessageObj(topic, messageobj) {
    if (super.ProcessMessageObj(topic, messageobj))
      return true;

    return false;
  }
}
module.exports = ThSonoffRF;