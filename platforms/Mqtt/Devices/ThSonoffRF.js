const dayjs = require('dayjs');
const Thinking = require('./Thinking');
const { BoolStateEntity, ButtonEntity } = require('../../Entity');
const { ButtonAction, SelectAction, RangeAction, } = require('../../Action');
const { ToggleBoardItem, PushBoardItem, } = require('../../BoardItem');

class ThSonoffRF extends Thinking {
  get icon() { return this.setting.icon || "fa fa-broadcast-tower"; }
  entities = {};
  last5rfcode = [];
  GetStatusInfos() {
    const result = super.GetStatusInfos();
    if (this.last5rfcode.length) {
      result.push({ device: this, message: "" });
      result.push({ device: this, message: "Last RF codes" });
      for (const rfcode of this.last5rfcode)
        result.push({ device: this, message: '', value: rfcode, });
    }
    return result;
  }
  async Start() {
    await super.Start();
  }
  Tick(seconds) {
    if (seconds % 60 != 0)
      return;
  }
  ProcessMessage(topic, message) {
    if (super.ProcessMessage(topic, message))
      return true;
    if (topic.match(`^event\/${this.GetTopic()}\/rfcode$`)) {
      this.last5rfcode.push(message);
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