const path = require('path')
const got = require('got')
const xmlparser = require('fast-xml-parser')

const GenericCamera = require('./GenericCamera')

const uriinitpicture = '/initpicture'

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

  hikvisionDeviceType = '';
  hikvisionDeviceName = '';
  hikvisionModel = '';
  hikvisionFirmware = '';

  imagechannelid = null
  initialpicture = null

  GetStatusInfos() {
    const result = []
    if (!this.setting.ip) result.push({ error: true, message: __('IP address not set') })

    if (this.hikvisionModel) result.push({ message: 'Model', value: `${this.hikvisionModel} (${this.hikvisionDeviceType})` })
    if (this.hikvisionFirmware) result.push({ message: __('Version'), value: this.hikvisionFirmware })
    if (this.hikvisionDeviceName) result.push({ message: __('Name'), value: this.hikvisionDeviceName })
    return result
  }

  async Start() {
    await super.Start()

    await this.InitDeviceInfo()
    await this.InitPicture()

    this.approuter.get(uriinitpicture, this.WebInitPicture.bind(this))
  }

  async InitDeviceInfo() {
    const devicexml = await this.GetISAPI('/ISAPI/System/deviceInfo')
    if (devicexml) {
      const deviceinfo = xmlparser.parse(devicexml)
      if (deviceinfo && deviceinfo.DeviceInfo) {
        this.hikvisionDeviceType = deviceinfo.DeviceInfo.deviceType
        this.hikvisionDeviceName = deviceinfo.DeviceInfo.deviceName
        this.hikvisionModel = deviceinfo.DeviceInfo.model
        this.hikvisionFirmware = deviceinfo.DeviceInfo.firmwareVersion
      } else logger.warn('[HikvisionIsapi] Invalid XML from /ISAPI/System/deviceInfo')
    }
  }

  async InitPictureChannel() {
    if (this.imagechannelid !== null) return

    const pictureinfoxml = await this.GetISAPI('/ISAPI/Image/Channels')
    if (pictureinfoxml) {
      const pictureinfo = xmlparser.parse(pictureinfoxml)
      if (pictureinfo && pictureinfo.ImageChannellist && pictureinfo.ImageChannellist.ImageChannel) {
        if (pictureinfo.ImageChannellist.ImageChannel.enabled) {
          this.imagechannelid = pictureinfo.ImageChannellist.ImageChannel.id
        } else {
          this.imagechannelid = -1
          logger.warn('[HikvisionIsapi] No valid image channel')
        }
      } else logger.warn('[HikvisionIsapi] Invalid XML from /ISAPI/Image/Channels')
    }
  }

  async InitPicture() {
    await this.InitPictureChannel()

    if (this.imagechannelid === undefined) return
    if (this.imagechannelid < 0) return

    const picture = await this.GetISAPI(`/ISAPI/Streaming/channels/${this.imagechannelid}/picture`, true)
    this.initialpicture = picture

    // this.GetISAPI('/ISAPI/System/deviceInfo')

    // http://192.168.1.201/ISAPI/Image/Channels
    // http://192.168.1.201/ISAPI/Streaming/channels/1/picture
  }

  async GetISAPI(uri, raw = false) {
    const url = path.join(`http://${this.setting.ip}`, uri)
    try {
      const options = {
        username: this.setting.username || '',
        password: this.setting.password || ''
      }

      const response = await got.get(url, options)

      return raw ? response.rawBody : response.body
    } catch (error) {
      logger.error(`${error.message} with url ${url}`)
      return null
    }
  }

  GetPicture() {
    return null
  }

  async WebInitPicture(req, res, next) {
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': Buffer.byteLength(this.initialpicture)
    })
    res.send(this.initialpicture)
  }
}
module.exports = HikvisionIsapi
