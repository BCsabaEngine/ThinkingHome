const SecurityDevice = require('../SecurityDevice')

class GenericCamera extends SecurityDevice {
  get icon() { return 'fa fa-video' }

  GetPicture() { return null }
}

module.exports = GenericCamera
