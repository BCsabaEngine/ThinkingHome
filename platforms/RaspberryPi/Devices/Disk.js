const RaspberryPiDevice = require('../RaspberryPiDevice');
const si = require('systeminformation');
const { NumericValueGaugeEntity, PercentValueEntity } = require('../../Entity');
const { NumericValueGaugeBoardItem } = require('../../BoardItem');

class RaspberryPiDisk extends RaspberryPiDevice {
  setting = {
    diskname: '',
    toDisplayList: function () {
      const result = {};
      const availabledisks = {};
      for (const data of this.platform.fssize)
        availabledisks[data.fs] = data.fs;
      result["diskname"] = {
        type: 'select',
        title: 'Disk name',
        value: this.setting.diskname,
        lookup: JSON.stringify(availabledisks).replace(/["]/g, "\'"),
        error: !this.setting.diskname,
        canclear: false,
      };
      return result;
    }.bind(this),
    toTitle: function () { return "Used: " + this.entities.usagepercent; }.bind(this),
    toSubTitle: function () { return this.setting.diskname; }.bind(this),
  };
  icon = "fa fa-hdd";
  entities = {
    free: new NumericValueGaugeEntity(this, "free", "Free space", "fa fa-chart-pie")
      .InitUnit("GB")
      .AddBoardItem(new NumericValueGaugeBoardItem()),
    usage: new NumericValueGaugeEntity(this, "usage", "Used space", "fa fa-chart-pie")
      .InitUnit("GB")
      .AddBoardItem(new NumericValueGaugeBoardItem()),
    freepercent: new PercentValueEntity(this, "freepercent", "Free percent", "fa fa-chart-pie")
      .InitLowLevels(30, 10)
      .AddBoardItem(new NumericValueGaugeBoardItem()),
    usagepercent: new PercentValueEntity(this, "usagepercent", "Used percent", "fa fa-chart-pie")
      .InitHighLevels(70, 90)
      .AddBoardItem(new NumericValueGaugeBoardItem()),
  };
  GetStatusInfos() {
    const result = [];
    if (!this.setting.diskname) result.push({ error: true, message: 'Disk name not set' });
    return result;
  }

  Tick(seconds) {
    if (seconds % 60 != 0)
      return;

    for (const data of this.platform.fssize)
      if (data.fs == this.setting.diskname)
        if (!Number.isNaN(data.size) && !Number.isNaN(data.used)) {
          const size = data.size;
          const used = data.used;
          const free = size - used;

          this.entities.free.InitMinMaxValue(0, Math.round(size / 1024 / 1024 / 1024));
          this.entities.usage.InitMinMaxValue(0, Math.round(size / 1024 / 1024 / 1024));
          this.entities.free.SetValue((free / 1024 / 1024 / 1024).toFixed(2));
          this.entities.usage.SetValue((used / 1024 / 1024 / 1024).toFixed(2));

          if (size != 0) {
            this.entities.freepercent.SetValue(Math.round(100 * free / size));
            this.entities.usagepercent.SetValue(Math.round(100 * used / size));
          }
        }
  }
}
module.exports = RaspberryPiDisk;