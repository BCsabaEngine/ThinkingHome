const GenericDevice = require('./GenericDevice')
const { StateEntity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

class E1926 extends GenericDevice {
  ProcessSpecificMessageObj(messageobj) {
    this.entities.roller.SetState(messageobj.position || '0')
  }

  entities = {
    roller: new StateEntity(this, 'roller', 'Roller', 'fa fa-scroll')
      .AddAction(new ButtonAction(this, 'pos0', 'Position 0', 'fa fa-scroll', () => { this.SendPosition({ position: 0 }) }))
      .AddAction(new ButtonAction(this, 'pos10', 'Position 10', 'fa fa-scroll', () => { this.SendPosition({ position: 10 }) }))
      .AddAction(new ButtonAction(this, 'pos25', 'Position 25', 'fa fa-scroll', () => { this.SendPosition({ position: 25 }) }))
      .AddAction(new ButtonAction(this, 'pos50', 'Position 50', 'fa fa-scroll', () => { this.SendPosition({ position: 50 }) }))
      .AddAction(new ButtonAction(this, 'pos75', 'Position 75', 'fa fa-scroll', () => { this.SendPosition({ position: 75 }) }))
      .AddAction(new ButtonAction(this, 'pos90', 'Position 90', 'fa fa-scroll', () => { this.SendPosition({ position: 90 }) }))
      .AddAction(new ButtonAction(this, 'pos100', 'Position 100', 'fa fa-scroll', () => { this.SendPosition({ position: 100 }) }))

      .AddAction(new ButtonAction(this, 'pos', 'Position', 'fa fa-scroll', (position) => { this.SendPosition({ position: position }) }))
  };

  get icon() { return 'fa fa-scroll' }

  async Start() {
    await super.Start()
    setTimeout(function () {
      this.SendCommand('get', JSON.stringify({ position: '' }))
    }.bind(this), 3 * 1000)
  }

  SendPosition(data) { this.SendCommand('set', JSON.stringify(data)) }
}
module.exports = E1926
