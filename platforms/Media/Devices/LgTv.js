const lgtv2 = require('lgtv2')

const MediaDevice = require('../MediaDevice')
const { NumericValueGaugeEntity } = require('../../Entity')
const { NumericValueGaugeBoardItem } = require('../../BoardItem')

class LgTv extends MediaDevice {
  lgtvcli = null;

  setting = {
    ip: '',
    mac: '',
    tvkey: '',
    toDisplayList: function () {
      const result = {}
      result.ip = {
        type: 'text',
        title: 'IP address',
        value: this.setting.ip,
        error: !this.setting.ip,
        canclear: false,
        onchange: function () { this.InitCli() }.bind(this)
      }
      result.mac = {
        type: 'text',
        title: 'MAC address',
        value: this.setting.mac,
        error: !this.setting.mac,
        canclear: false
      }
      result.tvkey = {
        type: 'label',
        title: 'Secret key',
        value: this.setting.tvkey,
        displayvalue: this.setting.tvkey ? `${this.setting.tvkey.substr(0, 10)}...[${this.setting.tvkey.length}]` : '',
        error: false,
        canclear: true,
        onchange: function () { this.InitCli() }.bind(this)
      }
      return result
    }.bind(this),
    toTitle: function () { return 'LG Tv' },
    toSubTitle: function () { return this.setting.ip }.bind(this)
  };

  get icon() { return 'fa fa-tv' }
  entities = {
    volume: new NumericValueGaugeEntity(this, 'volume', 'Volume', 'fa fa-volume-up')
      .InitUnit('')
      // eslint-disable-next-line no-magic-numbers
      .InitMinMaxValue(0, 100).InitHighLevels(40, 70)
      .AddBoardItem(new NumericValueGaugeBoardItem())
  };

  lgProductName = '';
  lgModelName = '';
  lgVersion = '';
  lgCountry = '';
  lgLanguageCode = '';

  lgInputs = [];
  lgLaunchPoints = [];

  GetStatusInfos() {
    const result = []
    if (!this.setting.ip) result.push({ error: true, message: 'IP address not set' })
    if (!this.setting.mac) result.push({ error: true, message: 'MAC address not set' })

    if (this.lgProductName) result.push({ message: 'Product', value: this.lgProductName })
    if (this.lgVersion) result.push({ message: 'Version', value: `v${this.lgVersion}` })
    if (this.lgModelName) result.push({ message: 'Model', value: this.lgModelName })
    if (this.lgCountry || this.lgLanguageCode) result.push({ message: 'Country / lang', value: `${this.lgCountry} / ${this.lgLanguageCode}` })
    return result
  }

  async Start() {
    await super.Start()
    this.InitCli()
  }

  OnConnect() {
    this.lgtvcli.request('ssap://com.webos.service.update/getCurrentSWInformation', function (err, res) {
      if (!err && res.returnValue) {
        this.lgProductName = res.product_name
        this.lgModelName = res.model_name
        this.lgVersion = res.major_ver + '.' + res.minor_ver
        this.lgCountry = res.country_group + '-' + res.country
        this.lgLanguageCode = res.language_code
      }
    }.bind(this))

    this.lgtvcli.subscribe('ssap://audio/getVolume', function (err, res) {
      if (err) return
      if (!res.returnValue) return

      this.entities.volume.SetValue(res.muted ? 0 : res.volume)
    }.bind(this))

    this.lgtvcli.subscribe('ssap://com.webos.applicationManager/getForegroundAppInfo', function (err, res) {
      if (err) return
      if (!res.returnValue) return

      // this res.appId
      // console.log(res)
    }.bind(this))

    this.lgtvcli.request('ssap://tv/getExternalInputList', function (err, res) {
      if (err) return
      if (!res.returnValue) return

      this.lgInputs = res
      // console.log(res)
    }.bind(this))

    this.lgtvcli.request('ssap://com.webos.applicationManager/listLaunchPoints', function (err, res) {
      if (err) return
      if (!res.returnValue) return

      this.lgLaunchPoints = res
      // console.log(res)
    }.bind(this))
  }

  InitCli() {
    if (this.setting.ip) {
      this.lgtvcli = lgtv2({
        url: `ws://${this.setting.ip}:3000`,
        timeout: 10 * 1000,
        reconnect: 10 * 1000,
        saveKey: function (key) { if (this.setting.tvkey !== key) this.AdaptSetting('tvkey', key) }.bind(this),
        clientKey: this.setting.tvkey
      })
      this.lgtvcli.on('connect', this.OnConnect.bind(this))
    } else this.lgtvcli = null
  }
}
module.exports = LgTv
