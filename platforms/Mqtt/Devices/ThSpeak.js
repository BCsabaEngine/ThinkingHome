const { Entity } = require('../../Entity')
const { ButtonAction } = require('../../Action')
const Thinking = require('./Thinking')

class ThSpeak extends Thinking {
  get icon() { return 'fa fa-bullhorn' }
  entities = {
    speak: new Entity(this, 'speak', 'Speak', 'fa fa-bullhorn')
      .AddAction(new ButtonAction(this, 'test', 'Test speak', 'fa fa-bullhorn', () => {
        this.GetOrGenerateMp3('x')
        this.SendCmd('playmp3', { url: 'http://brain.thinkinghome.hu/hello.mp3', volume: 10 })
      }))
      .AddAction(new ButtonAction(this, 'play', 'Play sentence', 'fa fa-bullhorn', (...args) => {
        // console.log(args)
      }))
  }

  setting = {
    toDisplayList: function () { return [] },
    toTitle: function () { return this.constructor.name }.bind(this),
    toSubTitle: function () { return '' }
  };

  GetOrGenerateMp3(text) {
    const keys = this.GetDataKeys()
    if (keys && keys.length && keys.includes(text)) { }
  }

  // ProcessMessage(topic, message) {
  //   if (super.ProcessMessage(topic, message)) { return true }

  //   return false
  // }

  // ProcessMessageObj(topic, messageobj) {
  //   if (super.ProcessMessageObj(topic, messageobj)) { return true }

  //   return false
  // }
}
module.exports = ThSpeak
