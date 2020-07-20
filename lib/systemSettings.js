class SystemSettings {
  latitude = 0;
  longitude = 0;
  openweathermapapikey = '';

  Init(cb) {
    const properties =
      Object.getOwnPropertyNames(this)
        .filter(item => !item.startsWith("_"));

    const SystemSetting = require.main.require('./models/SystemSetting');
    SystemSetting.GetAll()
      .then(settingrows => {
        settingrows.forEach(settingrow => {
          if (properties.includes(settingrow.Name))
            this[settingrow.Name] = settingrow.Value;
        });
      })
      .then(cb);
  }

  _timer = null;
  LazyStore() {
    if (this._timer)
      clearTimeout(this._timer);
    this._timer = setTimeout(function () {
      this._timer = null;

      let rows = [];
      Object.getOwnPropertyNames(this)
        .filter(item => !item.startsWith("_"))
        .forEach(property => { rows.push({ Name: property, Value: this[property] }); });

      const SystemSetting = require.main.require('./models/SystemSetting');
      SystemSetting.StoreAll(rows);

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

  get OpenweathermapApiKey() {
    return this.openweathermapapikey;
  }

  set OpenweathermapApiKey(val) {
    this.openweathermapapikey = val;
    this.LazyStore();
  }
}

module.exports = SystemSettings;