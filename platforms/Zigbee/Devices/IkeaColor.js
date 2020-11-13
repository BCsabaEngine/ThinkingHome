const ColorUtils = require('../../../lib/colorUtils')

const GenericDevice = require('./GenericDevice')
const { Entity, TelemetryEntity, BoolStateEntity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

const brightmin = 1
const brightmid = 127
const brightmax = 255

const colortempmin = 2500
const colortempmax = 7000

const colortempwarm = 2500
const colortempnatural = 4000
const colortempcold = 6500

const brightstep = 30

class IkeaColor extends GenericDevice {
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
      })),

    color: new Entity(this, 'color', 'Color', 'fa fa-palette')
      .AddAction(new ButtonAction(this, 'warmwhite', 'Warm white', 'fa fa-thermometer-quarter', () => {
        const { r, g, b } = ColorUtils.colortemp2rgb(colortempwarm)
        const xy = ColorUtils.xyz2xy(ColorUtils.rgb2xyz([r, g, b]))
        this.SendState({
          state: 'ON',
          color: { x: xy[0], y: xy[1] }
        })
      }))
      .AddAction(new ButtonAction(this, 'naturalwhite', 'Natural white', 'fa fa-thermometer-quarter', () => {
        const { r, g, b } = ColorUtils.colortemp2rgb(colortempnatural)
        const xy = ColorUtils.xyz2xy(ColorUtils.rgb2xyz([r, g, b]))
        this.SendState({
          state: 'ON',
          color: { x: xy[0], y: xy[1] }
        })
      }))
      .AddAction(new ButtonAction(this, 'coldwhite', 'Cold white', 'fa fa-thermometer-quarter', () => {
        const { r, g, b } = ColorUtils.colortemp2rgb(colortempcold)
        const xy = ColorUtils.xyz2xy(ColorUtils.rgb2xyz([r, g, b]))
        this.SendState({
          state: 'ON',
          color: { x: xy[0], y: xy[1] }
        })
      }))
      .AddAction(new ButtonAction(this, 'rgb', 'Custom RGB', 'fa fa-thermometer-quarter', (r, g, b, brightness) => {
        const xy = ColorUtils.xyz2xy(ColorUtils.rgb2xyz([r, g, b]))
        this.SendState({
          state: 'ON',
          brightness: Math.min(Math.max(brightness, brightmin), brightmax),
          color: { x: xy[0], y: xy[1] }
        })
      }))
      .AddAction(new ButtonAction(this, 'white', 'Custom White', 'fa fa-thermometer-quarter', (ct, brightness) => {
        const { r, g, b } = ColorUtils.colortemp2rgb(Math.min(Math.max(ct, colortempmin), colortempmax))
        const xy = ColorUtils.xyz2xy(ColorUtils.rgb2xyz([r, g, b]))
        this.SendState({
          state: 'ON',
          brightness: Math.min(Math.max(brightness, brightmin), brightmax),
          color: { x: xy[0], y: xy[1] }
        })
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
module.exports = IkeaColor
