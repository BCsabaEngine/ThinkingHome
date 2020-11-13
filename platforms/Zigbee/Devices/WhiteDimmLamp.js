const GenericDevice = require('./GenericDevice')
const { TelemetryEntity, BoolStateEntity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

const brightmin = 1
const brightmid = 127
const brightmax = 255

const brightstep = 30

class WhiteDimmLamp extends GenericDevice {
  ProcessSpecificMessageObj(messageobj) {
    this.entities.state.SetState(messageobj.state === 'ON')
    this.entities.bright.SetValue(messageobj.brightness)
  }

  entities = {
    state: new BoolStateEntity(this, 'state', 'State', 'fa fa-toggle-on')
      .AddAction(new ButtonAction(this, 'toggle', 'Toggle', 'fa fa-toggle-on', () => {
        this.SendState({ state: 'TOGGLE' })
      }))
      .AddAction(new ButtonAction(this, 'switchoff', 'Switch Off', 'fa fa-toggle-off', () => {
        this.SendState({ state: 'OFF' })
      }))
      .AddAction(new ButtonAction(this, 'switchon', 'Switch On', 'fa fa-toggle-on', () => {
        this.SendState({ state: 'ON' })
      })),

    bright: new TelemetryEntity(this, 'bright', 'Bright', 'fa fa-adjust')
      .AddAction(new ButtonAction(this, 'brightmid', 'Mid bright', 'fa fa-adjust', () => {
        this.SendState({ state: 'ON', brightness: brightmid })
      }))
      .AddAction(new ButtonAction(this, 'brightlow', 'Low bright', 'fa fa-adjust', () => {
        this.SendState({ state: 'ON', brightness: brightmin })
      }))
      .AddAction(new ButtonAction(this, 'brighthigh', 'High bright', 'fa fa-adjust', () => {
        this.SendState({ state: 'ON', brightness: brightmax })
      }))
      .AddAction(new ButtonAction(this, 'brightup', `+${brightstep} bright`, 'fa fa-plus-circle', () => {
        this.SendState({ state: 'ON', brightness: Math.min(Math.max(this.entities.bright.value + brightstep, brightmin), brightmax) })
      }))
      .AddAction(new ButtonAction(this, 'brightdown', `-${brightstep} bright`, 'fa fa-minus-circle', () => {
        this.SendState({ state: 'ON', brightness: Math.min(Math.max(this.entities.bright.value - brightstep, brightmin), brightmax) })
      }))
      .AddAction(new ButtonAction(this, 'bright', 'Bright', 'fa fa-adjust', (brightness) => {
        this.SendState({ state: 'ON', brightness: Math.min(Math.max(brightness, brightmin), brightmax) })
      }))
  };

  get icon() { return 'fa fa-lightbulb' }

  async Start() {
    await super.Start()
    setTimeout(function () {
      this.SendCommand('get', JSON.stringify({ state: '' }))
    }.bind(this), 3 * 1000)
  }

  SendState(data) { this.SendCommand('set', JSON.stringify(data)) }
}
module.exports = WhiteDimmLamp
