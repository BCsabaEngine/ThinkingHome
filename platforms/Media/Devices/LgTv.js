const lgtv2 = require('lgtv2')
const wakeonlan = require('wakeonlan')

const ExpirationQueue = require('../../../lib/expirationQueue')
const MediaDevice = require('../MediaDevice')
const { Entity, TelemetryEntity, BoolStateEntity } = require('../../Entity')
const { NumericValueGaugeBoardItem } = require('../../BoardItem')
const { ButtonAction } = require('../../Action')

const reconnectsecs = 5
const queuesecs = 20

class LgTv extends MediaDevice {
  lgtvcli = null;
  cmdqueue = new ExpirationQueue()

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

    state: new BoolStateEntity(this, 'state', 'State', 'fa fa-toggle-on')
      .AddBoardItem(new NumericValueGaugeBoardItem())
      .AddAction(new ButtonAction(this, 'switchoff', 'Switch Off', 'fa fa-toggle-off', () => {
        if (!this.lgtvcli) return
        this.lgtvcli.request('ssap://system/turnOff')
      }))
      .AddAction(new ButtonAction(this, 'switchon', 'Switch On', 'fa fa-toggle-on', () => {
        if (this.setting.mac) wakeonlan(this.setting.mac)
      })),

    volume: new TelemetryEntity(this, 'volume', 'Volume', 'fa fa-volume-up')
      // eslint-disable-next-line no-magic-numbers
      .InitMinMaxValue(0, 100).InitHighLevels(40, 70)
      .InitLastValue()
      .AddAction(new ButtonAction(this, 'mute', 'Mute', 'fa fa-volume-mute', () => {
        if (!this.lgtvcli) return

        const fnc = function () {
          this.lgtvcli.request('ssap://audio/setMute', { mute: this.volume.value })
        }.bind(this)

        if (this.entities.state.state) fnc()
        else this.cmdqueue.add(fnc, queuesecs * 1000)
      }))
      .AddAction(new ButtonAction(this, 'volumeup', 'Volume Up', 'fa fa-volume-up', () => {
        if (!this.lgtvcli) return

        const fnc = function () {
          this.lgtvcli.request('ssap://audio/setMute', { mute: false }, function (err, res) {
            if (err) return
            this.lgtvcli.request('ssap://audio/setVolume', { volume: this.volume.value + 1 })
          }.bind(this))
        }.bind(this)

        if (this.entities.state.state) fnc()
        else this.cmdqueue.add(fnc, queuesecs * 1000)
      }))
      .AddAction(new ButtonAction(this, 'volumedown', 'Volume Down', 'fa fa-volume-down', () => {
        if (!this.lgtvcli) return

        const fnc = function () {
          this.lgtvcli.request('ssap://audio/setMute', { mute: false }, function (err, res) {
            if (err) return
            this.lgtvcli.request('ssap://audio/setVolume', { volume: this.volume.value - 1 })
          }.bind(this))
        }.bind(this)

        if (this.entities.state.state) fnc()
        else this.cmdqueue.add(fnc, queuesecs * 1000)
      }))
      .AddAction(new ButtonAction(this, 'volume', 'Volume', 'fa fa-volume-up', (volume) => {
        if (!this.lgtvcli) return

        const fnc = function () {
          this.lgtvcli.request('ssap://audio/setMute', { mute: false }, function (err, res) {
            if (err) return
            this.lgtvcli.request('ssap://audio/setVolume', { volume: volume })
          }.bind(this))
        }.bind(this)

        if (this.entities.state.state) fnc()
        else this.cmdqueue.add(fnc, queuesecs * 1000)
      }))
      .AddBoardItem(new NumericValueGaugeBoardItem()),

    app: new Entity(this, 'app', 'Application', 'fa fa-dice-d20')
      .SetToString(function () { return this.displayvalue })
      .AddAction(new ButtonAction(this, 'launch', 'Launch', 'fa fa-dice-d20', (id) => {
        if (!this.lgtvcli) return

        const fnc = function () {
          this.lgtvcli.request('ssap://system.launcher/launch', { id: id })
        }.bind(this)

        if (this.entities.state.state) fnc()
        else this.cmdqueue.add(fnc, queuesecs * 1000)
      })),

    toast: new Entity(this, 'toast', 'Toast', 'fa fa-comment-dots')
      .AddAction(new ButtonAction(this, 'test', 'Test message', 'fa fa-comment-dots', () => {
        if (!this.lgtvcli) return

        const fnc = function () {
          this.lgtvcli.request('ssap://system.notifications/createToast', { message: 'Hello! This is a test message.' })
        }.bind(this)

        if (this.entities.state.state) fnc()
        else this.cmdqueue.add(fnc, queuesecs * 1000)
      }))
      .AddAction(new ButtonAction(this, 'show', 'Show message', 'fa fa-comment-dots', (message) => {
        if (!this.lgtvcli) return

        const fnc = function () {
          this.lgtvcli.request('ssap://system.notifications/createToast', { message: message })
        }.bind(this)

        if (this.entities.state.state) fnc()
        else this.cmdqueue.add(fnc, queuesecs * 1000)
      }))

  };

  lgProductName = '';
  lgModelName = '';
  lgVersion = '';
  lgCountry = '';
  lgLanguageCode = '';

  // lgInputs = [];
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

  InitApps() {
    for (const favoriteapp of [
      { code: 'livetv', name: 'Live TV', id: 'com.webos.app.livetv' },
      { code: 'av1', name: 'AV', id: 'com.webos.app.externalinput.av1' },
      { code: 'hdmi1', name: 'HDMI-1', id: 'com.webos.app.hdmi1' },
      { code: 'hdmi2', name: 'HDMI-2', id: 'com.webos.app.hdmi2' },
      { code: 'hdmi3', name: 'HDMI-3', id: 'com.webos.app.hdmi3' },
      { code: 'hdmi4', name: 'HDMI-4', id: 'com.webos.app.hdmi4' },

      { code: 'music', name: 'Music', id: 'com.webos.app.music' },
      { code: 'video', name: 'Video', id: 'com.webos.app.photovideo' },
      { code: 'youtube', name: 'Youtube', id: 'youtube.leanback.v4' },
      { code: 'netflix', name: 'Netflix', id: 'netflix' },
      { code: 'spotify', name: 'Spotify', id: 'spotify-beehive' },

      { code: 'browser', name: 'Browser', id: 'com.webos.app.browser' },
      { code: 'miracast', name: 'Screen share', id: 'com.webos.app.miracast' }
    ]) {
      this.entities.app.AddAction(new ButtonAction(this, favoriteapp.code, favoriteapp.name, 'fa fa-dice-d20', () => {
        if (!this.lgtvcli) return

        const fnc = function () {
          this.lgtvcli.request('ssap://system.launcher/launch', { id: favoriteapp.id })
        }.bind(this)

        if (this.entities.state.state) fnc()
        else this.cmdqueue.add(fnc, queuesecs * 1000)
      }))
    }
  }

  async Start() {
    await super.Start()
    this.InitApps()
    this.InitCli()
  }

  OnConnect() {
    this.entities.state.SetState(true)

    this.lgtvcli.request('ssap://com.webos.service.update/getCurrentSWInformation', function (err, res) {
      if (!err && res.returnValue) {
        this.lgProductName = res.product_name
        this.lgModelName = res.model_name
        this.lgVersion = res.major_ver + '.' + res.minor_ver
        this.lgCountry = res.country_group + '-' + res.country
        this.lgLanguageCode = res.language_code
      }
    }.bind(this))

    this.lgtvcli.request('ssap://com.webos.applicationManager/listLaunchPoints', function (err, res) {
      if (err) return
      if (!res.returnValue) return

      this.lgLaunchPoints = res.launchPoints
      // console.log(res.launchPoints)
    }.bind(this))

    this.lgtvcli.request('ssap://com.webos.applicationManager/getForegroundAppInfo', function (err, res) {
      if (err) return
      if (!res.returnValue) return

      const id = res.appId
      const app = this.lgLaunchPoints.find((i) => i.id === id)
      if (app) this.entities.app.displayvalue = app.title
    }.bind(this))

    this.lgtvcli.subscribe('ssap://audio/getVolume', function (err, res) {
      if (err) return
      if (!res.returnValue) return

      this.entities.volume.SetValue(res.muted ? 0 : res.volume)
    }.bind(this))

    this.lgtvcli.subscribe('ssap://com.webos.applicationManager/getForegroundAppInfo', function (err, res) {
      if (err) return
      if (!res.returnValue) return

      const id = res.appId
      const launchapp = this.lgLaunchPoints.find((i) => i.id === id)
      if (launchapp) this.entities.app.xxxx = launchapp.title
    }.bind(this))

    while (!this.cmdqueue.empty) {
      const qitem = this.cmdqueue.get()
      if (typeof qitem === 'function') qitem()
    }
  }

  InitCli() {
    this.lgtvcli = null

    if (!this.setting.ip) return

    try {
      this.lgtvcli = lgtv2({
        url: `ws://${this.setting.ip}:3000`,
        timeout: 500,
        reconnect: reconnectsecs * 1000,
        saveKey: function (key) { if (this.setting.tvkey !== key) this.AdaptSetting('tvkey', key) }.bind(this),
        clientKey: this.setting.tvkey
      })
      this.lgtvcli.on('error', (err) => { return err })
      this.lgtvcli.on('close', () => { this.entities.state.SetState(false) })
      this.lgtvcli.on('connect', this.OnConnect.bind(this))
    } catch (error) { return false }
  }
}
module.exports = LgTv
