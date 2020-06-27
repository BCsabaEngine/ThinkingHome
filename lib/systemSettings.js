const logger = requireRoot("/lib/logger");

class SystemSettings {
  latitude = 0;
  longitude = 0;

  async Init() {
    const properties =
      Object.getOwnPropertyNames(this)
        .filter(item => !item.startsWith("_"));

    const SystemSetting = requireRoot('/models/SystemSetting');
    const settingrows = await SystemSetting.GetAll();
    settingrows.forEach(settingrow => {
      if (properties.includes(settingrow.Name))
        this[settingrow.Name] = settingrow.Value;
    });
  }

  _timer = null;
  async LazyStore() {
    if (this._timer)
      clearTimeout(this._timer);
    this._timer = setTimeout(async function () {
      this._timer = null;

      let rows = [];
      Object.getOwnPropertyNames(this)
        .filter(item => !item.startsWith("_"))
        .forEach(property => { rows.push({ Name: property, Value: this[property] }); });

      const SystemSetting = requireRoot('/models/SystemSetting');
      await SystemSetting.StoreAll(rows);

      logger.debug("SystemSettings stored");
    }.bind(this), 2000);
  }

  AdaptFromObject(obj) {
    const properties =
      Object.getOwnPropertyNames(this)
        .filter(item => !item.startsWith("_"));

    Object.getOwnPropertyNames(obj).forEach(function (objprop) {
      if (properties.includes(objprop))
        this[objprop] = obj[objprop];
    }.bind(this));

    this.LazyStore();
  }

  get Latitude() {
    return parseFloat(this.latitude);
  }

  set Latitude(val) {
    this.latitude = val;
    this.LazyStore();
  }

  get Longitude() {
    return parseFloat(this.longitude);
  }

  set Longitude(val) {
    this.longitude = val;
    this.LazyStore();
  }
}

module.exports = SystemSettings;