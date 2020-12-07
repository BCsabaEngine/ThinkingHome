const TelegramDevice = require('../TelegramDevice')
const { Entity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

class Chat extends TelegramDevice {
  setting = {
    id: '',
    toDisplayList: function () {
      const result = {}
      result.id = {
        type: 'text',
        title: __('Chat ID'),
        value: this.setting.id,
        error: !this.setting.id,
        canclear: false
      }
      return result
    }.bind(this),
    toTitle: function () { return 'Chat' },
    toSubTitle: function () { return this.setting.id }.bind(this)
  };

  get icon() { return 'fa fa-comment-alt' }
  entities = {
    messages: new Entity(this, 'messages', 'Messages', 'fa fa-comment-alt')
      .AddAction(new ButtonAction(this, 'test', 'Test message', 'fa fa-comment-alt', () => {
        this.SendMessage('Test message from ThinkingHome bot')
      }))
      .AddAction(new ButtonAction(this, 'send', 'Send message', 'fa fa-comment-alt', (message) => {
        this.SendMessage(message)
      }))
  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.id) result.push({ error: true, message: __('Chat ID not set') })
    return result
  }

  SendMessage(message) { this.platform.SendMessage(this.setting.id, message) }
}
module.exports = Chat
