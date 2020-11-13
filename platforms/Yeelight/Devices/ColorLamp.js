const GenericDevice = require('./GenericDevice')
const { Entity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

const colortempwarm = 2000
const colortempnatural = 4500
const colortempcold = 6500

class ColorLamp extends GenericDevice {
  additionalentities = {
    color: new Entity(this, 'color', 'Color', 'fa fa-palette')
      .AddAction(new ButtonAction(this, 'warmwhite', 'Warm white', 'fa fa-thermometer-quarter', () => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setCT(colortempwarm)
      }))
      .AddAction(new ButtonAction(this, 'naturalwhite', 'Natural white', 'fa fa-thermometer-quarter', () => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setCT(colortempnatural)
      }))
      .AddAction(new ButtonAction(this, 'coldwhite', 'Cold white', 'fa fa-thermometer-quarter', () => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        this.yeelight.setCT(colortempcold)
      }))
      .AddAction(new ButtonAction(this, 'rgb', 'Custom RGB', 'fa fa-thermometer-quarter', (r, g, b, brightness) => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        if (r && g && b) this.yeelight.setRGB([r, g, b])
        if (brightness) this.yeelight.setBright(brightness)
      }))
      .AddAction(new ButtonAction(this, 'white', 'Custom White', 'fa fa-thermometer-quarter', (ct, brightness) => {
        if (!this.yeelight) return

        if (!this.entities.state.state) this.yeelight.setPower(true)
        if (ct) this.yeelight.setCT(ct)
        if (brightness) this.yeelight.setBright(brightness)
      }))

  }
}
module.exports = ColorLamp
