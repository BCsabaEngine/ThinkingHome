const stringUtils = require('../lib/stringUtils')
const objectUtils = require('../lib/objectUtils')

class SystemSettings {
  Init() {
    const properties =
      Object.getOwnPropertyNames(this)
        .filter(item => !item.startsWith('_'))

    const SystemSettingModel = require('../models/SystemSetting')
    return SystemSettingModel.GetAll()
      .then(settingrows => {
        for (const settingrow of settingrows) {
          if (properties.includes(settingrow.Name)) {
            this[settingrow.Name] = stringUtils.unbox(settingrow.Value)
          }
        }
        logger.info('[SystemSettings] Settings initialized')
        // setTimeout(function () { console.log(this) }.bind(this), 3000)
      })
  }

  _timer = null;
  LazyStore() {
    if (this._timer) { clearTimeout(this._timer) }

    const timerdelayms = 2000
    this._timer = setTimeout(function () {
      this._timer = null

      const rows = []
      for (const property of Object.getOwnPropertyNames(this).filter(item => !item.startsWith('_'))) { rows.push({ Name: property, Value: stringUtils.box(this[property]) }) }

      const SystemSettingModel = require('../models/SystemSetting')
      SystemSettingModel.StoreAll(rows)

      logger.info('[SystemSettings] Settings stored')
    }.bind(this), timerdelayms)
  }

  SetByName(name, value) {
    const obj = {}
    obj[name] = value

    this.AdaptFromObject(obj)
  }

  AdaptFromObject(obj) {
    const properties = objectUtils.getAccessors(this, false, true)

    for (const objprop of Object.getOwnPropertyNames(obj)) {
      if (properties.includes(objprop)) {
        this[objprop] = obj[objprop]
      }
    }

    this.LazyStore()
  }

  // eslint-disable-next-line no-magic-numbers
  latitude = 51.5; // London
  longitude = 0;
  get Latitude() { return parseFloat(this.latitude) }
  set Latitude(val) { this.latitude = parseFloat(val); this.LazyStore() }
  get Longitude() { return parseFloat(this.longitude) }
  set Longitude(val) { this.longitude = parseFloat(val); this.LazyStore() }

  openweathermapapikey = '';
  get OpenweathermapApiKey() { return this.openweathermapapikey }
  set OpenweathermapApiKey(val) { this.openweathermapapikey = val; this.LazyStore() }

  cloudtoken = '';
  get CloudToken() { return this.cloudtoken }
  set CloudToken(val) { this.cloudtoken = val; this.LazyStore() }

  banipby404 = 1;
  get BanIPBy404() { return !!this.banipby404 }
  set BanIPBy404(val) { this.banipby404 = !!val; this.LazyStore() }
}

module.exports = SystemSettings
