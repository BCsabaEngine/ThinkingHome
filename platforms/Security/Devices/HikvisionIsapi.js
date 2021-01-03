const GenericCamera = require('./GenericCamera')

class HikvisionIsapi extends GenericCamera {
  setting = {
    ip: '',
    username: '',
    password: '',
    toDisplayList: function () {
      const result = {}
      result.ip = {
        type: 'text',
        title: __('IP address'),
        value: this.setting.ip,
        error: !this.setting.ip,
        canclear: false
      }
      result.username = {
        type: 'text',
        title: __('Username'),
        value: this.setting.username,
        error: false,
        canclear: true
      }
      result.password = {
        type: 'text',
        title: __('Password'),
        value: this.setting.password ? '*'.repeat(this.setting.password.length) : '',
        error: false,
        canclear: true
      }
      return result
    }.bind(this),
    toTitle: function () { return 'Hikvision ISAPI' },
    toSubTitle: function () { return this.setting.ip }.bind(this)
  };

  get icon() { return 'fa fa-video' }

  GetStatusInfos() {
    const result = []
    if (!this.setting.ip) result.push({ error: true, message: __('IP address not set') })
    return result
  }

  GetPicture() { return null }
}
module.exports = HikvisionIsapi
