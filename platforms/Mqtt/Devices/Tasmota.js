const dayjs = require('dayjs')
const got = require('got')
const MqttDevice = require('../MqttDevice')
const { BoolStateEntity, EventEntity } = require('../../Entity')
const { ButtonAction } = require('../../Action')
const { ToggleBoardItem } = require('../../BoardItem')

class Tasmota extends MqttDevice {
  InitEntities() {
    for (let i = 1; i <= this.setting.powercount; i++) {
      this.entities[`power${i}`] = new BoolStateEntity(this, `power${i}`, `Power${i}`, 'fa fa-toggle-on')
        .InitStateIcons('fa fa-toggle-off', 'fa fa-toggle-on')
        .AddAction(new ButtonAction(this, 'toggle', 'Toggle', 'fa fa-toggle-on', function () { this.device.SendCmnd(`power${i}`, 'toggle') }))
        .AddAction(new ButtonAction(this, 'switchon', 'Switch on', 'fa fa-toggle-on', function () { this.device.SendCmnd(`power${i}`, 'on') }))
        .AddAction(new ButtonAction(this, 'switchoff', 'Switch off', 'fa fa-toggle-off', function () { this.device.SendCmnd(`power${i}`, 'off') }))
        .AddBoardItem(new ToggleBoardItem())
    }
    for (let i = 1; i <= this.setting.buttoncount; i++) {
      this.entities[`button${i}`] = new EventEntity(this, `button${i}`, `Button${i}`, 'fa fa-dot-circle')
        .InitEvents(['push', 'single', 'double', 'triple', 'hold'])
        .AddEventWithEmit('push', ['clicks'])
        .AddAction(new ButtonAction(this, 'push', 'Push', 'fa fa-dot-circle', function () {
          this.entity.DoEvent('single')
          this.entity.DoEvent('push', 1)
        }))
    }
    // .AddBoardItem(new PushBoardItem('push'))
    this.LinkUpEntities()
  }

  setting = {
    topic: '',
    powercount: 1,
    buttoncount: 1,
    icon: '',
    toDisplayList: function () {
      const result = {}
      result.topic = {
        type: 'text',
        title: __('MQTT topic'),
        value: this.setting.topic,
        displayvalue: function () { return this.setting.topic || `${this.name} (default)` }.bind(this)(),
        error: false,
        canclear: true
      }
      result.powercount = {
        type: 'select',
        title: __('Power count'),
        value: this.setting.powercount,
        lookup: JSON.stringify({ 0: 'None', 1: 1, 2: 2, 3: 3, 4: 4 }).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }
      result.buttoncount = {
        type: 'select',
        title: __('Button count'),
        value: this.setting.buttoncount,
        lookup: JSON.stringify({ 0: 'None', 1: 1, 2: 2 }).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }
      result.icon = {
        type: 'text',
        title: __('Icon'),
        value: this.setting.icon,
        displayvalue: function () { return this.setting.icon || 'fa fa-sliders-h (default)' }.bind(this)(),
        error: false,
        canclear: true
      }
      return result
    }.bind(this),
    toTitle: function () { return this.constructor.name }.bind(this),
    toSubTitle: function () {
      const result = []
      if (this.setting.powercount > 0) { result.push(`${this.setting.powercount}pow`) }
      if (this.setting.buttoncount > 0) { result.push(`${this.setting.buttoncount}btn`) }
      return result.join('+')
    }.bind(this)
  };

  // icon = "fa fa-sliders-h";
  get icon() { return this.setting.icon || 'fa fa-sliders-h' }
  entities = {};
  starttime = new Date().getTime();
  tasmotaTime = '';
  tasmotaModule = '';
  tasmotaRestartReason = '';
  tasmotaUptime = '';
  tasmotaBootCount = 0;
  tasmotaVersion = '';
  tasmotaIPAddress = '';
  tasmotaMqttCount = 0;
  tasmotaWifiSSId = '';
  tasmotaWifiRSSI = 0;
  tasmotaWifiLinkCount = 0;
  GetStatusInfos() {
    const result = []
    if (!this.tasmotaTime && (new Date().getTime() - this.starttime) > 10 * 1000) { result.push({ device: this, error: true, message: __('No info, maybe offline?') }) }
    if (this.tasmotaTime) { result.push({ device: this, message: __('Info time'), value: this.tasmotaTime ? dayjs(this.tasmotaTime).fromNow() : '' }) }
    if (this.tasmotaVersion) { result.push({ device: this, message: __('Version'), value: this.tasmotaVersion }) }
    if (this.tasmotaModule) { result.push({ device: this, message: __('Module'), value: this.tasmotaModule }) }
    if (this.tasmotaRestartReason) { result.push({ device: this, message: __('Start reason'), value: this.tasmotaRestartReason }) }
    if (this.tasmotaUptime) { result.push({ device: this, message: __('Uptime'), value: this.tasmotaUptime }) }
    if (this.tasmotaBootCount) { result.push({ device: this, message: __('Boot count'), value: this.tasmotaBootCount }) }
    if (this.tasmotaIPAddress) { result.push({ device: this, message: 'Wifi IP', value: this.tasmotaIPAddress }) }
    if (this.tasmotaWifiSSId) { result.push({ device: this, message: 'Wifi SSID', value: this.tasmotaWifiSSId }) }
    if (this.tasmotaWifiRSSI) { result.push({ device: this, message: 'Wifi RSSI', value: this.tasmotaWifiRSSI }) }
    if (this.tasmotaWifiLinkCount) { result.push({ device: this, message: __('Wifi link count'), value: this.tasmotaWifiLinkCount }) }
    if (this.tasmotaMqttCount) { result.push({ device: this, message: __('Mqtt link count'), value: this.tasmotaMqttCount }) }
    return result
  }

  async Start() {
    await super.Start()
    this.InitEntities()
    this.SendCmnd('STATUS', '0')
    for (let i = 1; i <= this.setting.powercount; i++) { this.SendCmnd(`POWER${i}`) }
  }

  async DumpBackup() {
    const ip = this.tasmotaIPAddress
    if (!ip) { throw new Error('Not known IP address') }

    const dump = await got(`http://${ip}/dl`, { timeout: 5000 })
    if (dump) { return dump.rawBody }

    throw new Error('Empty dump')
  }

  GetTopic() {
    return (this.setting.topic || this.name).toLowerCase()
  }

  SendCmnd(command, message) {
    const topic = `cmnd/${this.GetTopic()}/${command}`
    // console.log([topic, message]);
    this.platform.SendMessage(topic, message)
  }

  ProcessMessage(topic, message) {
    for (let i = 1; i <= this.setting.powercount; i++) {
      if (topic.match(`^stat/${this.GetTopic()}/POWER${i}$`) || (i === 1 && topic.match(`^stat/${this.GetTopic()}/POWER$`))) {
        this.entities[`power${i}`].SetState(message.toLowerCase() === 'ON'.toLowerCase() ? 1 : 0)
        return true
      }
    }

    if (topic.match(`^stat/${this.GetTopic()}/RESULT$`)) return true
    if (topic.match(`^cmnd/${this.GetTopic()}/(STATUS|POWER|power)`)) return true

    return false
  }

  ProcessMessageObj(topic, messageobj) {
    // Tasmota <= v8.5
    // stat/device/BUTTON1: single
    for (let i = 1; i <= this.setting.buttoncount; i++) {
      if (topic.match(`^stat/${this.GetTopic()}/BUTTON${i}$`)) {
        const buttonevent = messageobj.ACTION.toLowerCase()
        switch (buttonevent) {
          case 'SINGLE'.toLowerCase():
            this.entities[`button${i}`].DoEvent('single')
            this.entities[`button${i}`].DoEvent('push', 1)
            return true
          case 'DOUBLE'.toLowerCase():
            this.entities[`button${i}`].DoEvent('double')
            this.entities[`button${i}`].DoEvent('push', 2)
            return true
          case 'TRIPLE'.toLowerCase():
            this.entities[`button${i}`].DoEvent('triple')
            this.entities[`button${i}`].DoEvent('push', 3)
            return true
          case 'HOLD'.toLowerCase():
            this.entities[`button${i}`].DoEvent('hold')
            this.entities[`button${i}`].DoEvent('push', -1)
            return true
          default:
            return false
        }
      }
    }

    if (topic.match(`^stat/${this.GetTopic()}/RESULT$`)) {
      // Tasmota >= v9.0
      // stat/device/RESULT: {"Button1" : {"Action" : "SINGLE"}}
      for (let i = 1; i <= this.setting.buttoncount; i++) {
        const buttonid = `Button${i}`
        const op = messageobj[buttonid]
        if (op && op.Action) {
          switch (op.Action) {
            case 'SINGLE'.toUpperCase():
              this.entities[`button${i}`].DoEvent('single')
              this.entities[`button${i}`].DoEvent('push', 1)
              return true
            case 'DOUBLE'.toUpperCase():
              this.entities[`button${i}`].DoEvent('double')
              this.entities[`button${i}`].DoEvent('push', 2)
              return true
            case 'TRIPLE'.toUpperCase():
              this.entities[`button${i}`].DoEvent('triple')
              this.entities[`button${i}`].DoEvent('push', 3)
              return true
            case 'HOLD'.toUpperCase():
              this.entities[`button${i}`].DoEvent('hold')
              this.entities[`button${i}`].DoEvent('push', -1)
              return true
            default:
              return false
          }
        }
      }

      const message = Object.keys(messageobj).map((key) => key + '=' + messageobj[key])
      logger.debug(`[Tasmota] Result message on ${topic}: ${message}`)
      return true
    }

    if (topic.match(`^stat/${this.GetTopic()}/STATUS([0-9]*)$`)) {
      if (Object.keys(messageobj).length === 1) {
        const statustype = Object.keys(messageobj)[0]
        const statusobj = messageobj[statustype]
        switch (statustype) {
          case 'Status':
            this.tasmotaModule = statusobj.Module
            break

          case 'StatusPRM':
            this.tasmotaRestartReason = statusobj.RestartReason
            this.tasmotaUptime = statusobj.Uptime
            this.tasmotaBootCount = statusobj.BootCount
            break

          case 'StatusFWR':
            this.tasmotaVersion = statusobj.Version
            break

          case 'StatusNET':
            this.tasmotaIPAddress = statusobj.IPAddress
            break

          case 'StatusMQT':
            this.tasmotaMqttCount = statusobj.MqttCount
            break

          case 'StatusSTS':
            this.tasmotaWifiSSId = statusobj.Wifi.SSId
            this.tasmotaWifiRSSI = statusobj.Wifi.RSSI
            this.tasmotaWifiLinkCount = statusobj.Wifi.LinkCount
            break

          default:
            break
        }
        this.tasmotaTime = new Date().getTime()
        return true
      }
    }

    if (topic.match(`^tele/${this.GetTopic()}/STATE$`)) {
      this.tasmotaUptime = messageobj.Uptime
      this.tasmotaMqttCount = messageobj.MqttCount
      this.tasmotaWifiSSId = messageobj.Wifi.SSId
      this.tasmotaWifiRSSI = messageobj.Wifi.RSSI
      this.tasmotaWifiLinkCount = messageobj.Wifi.LinkCount

      this.tasmotaTime = new Date().getTime()
      return true
    }

    if (topic.match(`^tele/${this.GetTopic()}/INFO1$`)) {
      this.tasmotaModule = messageobj.Module
      this.tasmotaVersion = messageobj.Version
      return true
    }

    if (topic.match(`^tele/${this.GetTopic()}/INFO2$`)) {
      this.tasmotaIPAddress = messageobj.IPAddress
      return true
    }

    if (topic.match(`^tele/${this.GetTopic()}/INFO3$`)) {
      this.tasmotaRestartReason = messageobj.RestartReason
      return true
    }

    return false
  }
}
module.exports = Tasmota
