const { Yeelight } = require('../../../lib/yeelight')
const YeelightDevice = require('../YeelightDevice')
const { TelemetryEntity, BoolStateEntity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

class GenericDevice extends YeelightDevice {
  //  sensors = [];

  // InitEntities() {
  //   for (const sensor of this.sensors) {
  //     this.entities[sensor.code] = new TelemetryEntity(this, sensor.code, sensor.name, sensor.icon)
  //       .InitUnit(sensor.unit)
  //       .InitLastValue()
  //       .SetSmooth()
  //       .AddBoardItem(new NumericValueGaugeBoardItem())
  //     if (sensor.minvalue !== undefined) this.entities[sensor.code].InitMinValue(sensor.minvalue)
  //     if (sensor.maxvalue !== undefined) this.entities[sensor.code].InitMaxValue(sensor.maxvalue)
  //   }
  //   this.LinkUpEntities()
  // }

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
      .AddAction(new ButtonAction(this, 'switchoff', 'Switch Off', 'fa fa-toggle-off', () => {
        if (this.yeelight) this.yeelight.setPower(false)
      }))
      .AddAction(new ButtonAction(this, 'switchon', 'Switch On', 'fa fa-toggle-on', () => {
        if (this.yeelight) this.yeelight.setPower(true)
      })),

    bright: new TelemetryEntity(this, 'bright', 'Bright', 'fa fa-volume-up')
      .AddAction(new ButtonAction(this, 'bright1', 'Low bright', 'fa fa-volume-mute', () => {
        if (this.yeelight) this.yeelight.setBright(1)
      }))
      .AddAction(new ButtonAction(this, 'bright50', 'Med bright', 'fa fa-volume-mute', () => {
        if (this.yeelight) this.yeelight.setBright(50)
      }))
      .AddAction(new ButtonAction(this, 'bright100', 'High bright', 'fa fa-volume-mute', () => {
        if (this.yeelight) this.yeelight.setBright(100)
      }))
      .AddAction(new ButtonAction(this, 'brightup10', '+10 bright', 'fa fa-volume-up', () => {
        if (this.yeelight) this.yeelight.setBright(this.yeelight.bright + 10)
      }))
      .AddAction(new ButtonAction(this, 'brightdown10', '-10 bright', 'fa fa-volume-up', () => {
        if (this.yeelight) this.yeelight.setBright(this.yeelight.bright - 10)
      }))
      .AddAction(new ButtonAction(this, 'ct2000', '-10 bright', 'fa fa-volume-up', () => {
        if (this.yeelight) this.yeelight.setCT(2000)
      }))
      .AddAction(new ButtonAction(this, 'ct3000', '-10 bright', 'fa fa-volume-up', () => {
        if (this.yeelight) this.yeelight.setCT(3000)
      }))
      .AddAction(new ButtonAction(this, 'ct4500', '-10 bright', 'fa fa-volume-up', () => {
        if (this.yeelight) this.yeelight.setCT(4500)
      }))
      .AddAction(new ButtonAction(this, 'ct5500', '-10 bright', 'fa fa-volume-up', () => {
        if (this.yeelight) this.yeelight.setCT(5500)
      }))
      .AddAction(new ButtonAction(this, 'ct6500', '-10 bright', 'fa fa-volume-up', () => {
        if (this.yeelight) this.yeelight.setCT(6500)
      }))
  }

  yeelight = null;

  GetStatusInfos() {
    const result = []
    if (this.yeelight) {
      if (!this.yeelight.connected) result.push({ device: this, error: true, message: 'Not connected' })
    }
    return result
  }

  DeviceConnected(device) {
    console.log('connected')
  }

  DeviceDisconnected(device) {
    console.log('disconnected')
  }

  DeviceError(device) {
    console.log('error')
  }

  DeviceStateUpdate(device) {
    this.entities.state.SetState(device.power)

    this.entities.bright.SetValue(device.bright)

    console.log(device)
  }

  Init() {
    if (this.setting.host) {
      this.yeelight = new Yeelight()
      this.yeelight.on('connected', this.DeviceConnected.bind(this))
      this.yeelight.on('disconnected', this.DeviceDisconnected.bind(this))
      this.yeelight.on('error', this.DeviceError.bind(this))
      this.yeelight.on('stateUpdate', this.DeviceStateUpdate.bind(this))
      this.yeelight.init(this.setting.host)
    }
  }

  async Start() {
    await super.Start()
    this.Init()
    // setTimeout(function () { this.Init() }.bind(this), 3000)
  }

  // GetTopic() {
  //   return (this.setting.topic || this.name).toLowerCase()
  // }

  // SendCmnd(command, message) {
  //   const topic = `cmnd/${this.GetTopic()}/${command}`
  //   // console.log([topic, message]);
  //   this.platform.SendMessage(topic, message)
  // }

  // ProcessMessage(topic, message) {
  //   if (topic === this.GetTopic()) return true
  //   return false
  // }

  // ProcessActionObj(action) { }

  // ProcessMessageObj(topic, messageobj) { }
}
module.exports = GenericDevice
