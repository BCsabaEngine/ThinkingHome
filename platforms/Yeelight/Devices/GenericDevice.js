const { Yeelight } = require('../../../lib/yeelight')
const YeelightDevice = require('../YeelightDevice')
const { TelemetryEntity, BoolStateEntity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

const brighthalf = 50

const colortemp2000 = 2000
const colortemp4500 = 4500
const colortemp6500 = 6500

class GenericDevice extends YeelightDevice {
  additionalentities = {};

  InitAdditionalEntities() {
    for (const key of Object.keys(this.additionalentities)) this.entities[key] = this.additionalentities[key]
    this.LinkUpEntities()
  }

  setting = {
    host: '',
    toDisplayList: function () {
      const result = {}
      result.host = {
        type: 'text',
        title: 'Host/IP',
        value: this.setting.host,
        error: !this.setting.host,
        canclear: false,
        onchange: function () { this.Init() }.bind(this)
      }
      return result
    }.bind(this),
    toTitle: function () { return this.constructor.name }.bind(this),
    toSubTitle: function () { return this.setting.host }.bind(this)
  };

  entities = {
    state: new BoolStateEntity(this, 'state', 'State', 'fa fa-toggle-on')
      .AddAction(new ButtonAction(this, 'toggle', 'Toggle', 'fa fa-toggle-on', () => {
        if (this.yeelight) this.yeelight.setPower(!this.entities.state.state)
      }))
      .AddAction(new ButtonAction(this, 'switchoff', 'Switch Off', 'fa fa-toggle-off', () => {
        if (this.yeelight) this.yeelight.setPower(false)
      }))
      .AddAction(new ButtonAction(this, 'switchon', 'Switch On', 'fa fa-toggle-on', () => {
        if (this.yeelight) this.yeelight.setPower(true)
      })),

    bright: new TelemetryEntity(this, 'bright', 'Bright', 'fa fa-adjust')
      .AddAction(new ButtonAction(this, 'brightmid', 'Mid bright', 'fa fa-adjust', () => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setBright(brighthalf)
      }))
      .AddAction(new ButtonAction(this, 'brightlow', 'Low bright', 'fa fa-adjust', () => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setBright(1)
      }))
      .AddAction(new ButtonAction(this, 'brighthigh', 'High bright', 'fa fa-adjust', () => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setBright(100)
      }))
      .AddAction(new ButtonAction(this, 'brightup', '+10 bright', 'fa fa-plus-circle', () => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setBright(Math.min(this.yeelight.bright + 10, 100))
      }))
      .AddAction(new ButtonAction(this, 'brightdown', '-10 bright', 'fa fa-minus-circle', () => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setBright(Math.max(this.yeelight.bright - 10, 1))
      }))
      .AddAction(new ButtonAction(this, 'bright', 'Bright', 'fa fa-adjust', (brightness) => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setBright(brightness)
      }))
      .AddAction(new ButtonAction(this, 'rgb', 'Custom RGB', 'fa fa-thermometer-quarter', (r, g, b, brightness) => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        if (r && g && b) this.yeelight.setRGB([r, g, b])
        if (brightness) this.yeelight.setBright(brightness)
      }))
      .AddAction(new ButtonAction(this, 'ct', 'Custom CT', 'fa fa-thermometer-quarter', (ct, brightness) => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        if (ct) this.yeelight.setCT(ct)
        if (brightness) this.yeelight.setBright(brightness)
      }))
      .AddAction(new ButtonAction(this, 'ct2000', '-10 bright', 'fa fa-thermometer-quarter', (brightness) => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setCT(colortemp2000)
        if (brightness) this.yeelight.setBright(brightness)
      }))
      .AddAction(new ButtonAction(this, 'ct4500', '-10 bright', 'fa fa-thermometer-quarter', (brightness) => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setCT(colortemp4500)
        if (brightness) this.yeelight.setBright(brightness)
      }))
      .AddAction(new ButtonAction(this, 'ct6500', '-10 bright', 'fa fa-thermometer-quarter', (brightness) => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setCT(colortemp6500)
        if (brightness) this.yeelight.setBright(brightness)
      }))
  }

  yeelight = null;
  yeelighterror = null

  GetStatusInfos() {
    const result = []
    if (this.yeelight) {
      result.push({ device: this, message: 'Connection count', value: this.yeelight.connectioncount || '0' })
      if (!this.yeelight.isConnected()) result.push({ device: this, error: true, message: 'Not connected' })
      if (this.yeelighterror) result.push({ device: this, error: true, message: 'Error', value: this.yeelighterror })
    }
    return result
  }

  DeviceConnected(device) { this.yeelighterror = null }

  DeviceDisconnected(device) { }

  DeviceError(error) { this.yeelighterror = error.response }

  DeviceStateUpdate(device) {
    this.entities.state.SetState(device.power)

    this.entities.bright.SetValue(device.bright)
  }

  Init() {
    if (this.setting.host) {
      this.yeelight = new Yeelight()

      this.yeelight.on('connected', this.DeviceConnected.bind(this))
      this.yeelight.on('disconnected', this.DeviceDisconnected.bind(this))
      this.yeelight.on('failed', this.DeviceError.bind(this))
      this.yeelight.on('stateUpdate', this.DeviceStateUpdate.bind(this))

      this.yeelight.init(this.setting.host)
    }
  }

  async Start() {
    await super.Start()
    this.InitAdditionalEntities()
    this.Init()
  }
}
module.exports = GenericDevice
