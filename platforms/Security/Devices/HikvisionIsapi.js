const path = require('path')
const got = require('got')
const xmlparser = require('fast-xml-parser')
const sharp = require('sharp')

const GenericCamera = require('./GenericCamera')

const urilastpicture = '/lastpicture'
const urilastthumbnale = '/lastthumbnale'
const thumbnalesize = 320

class HikvisionIsapi extends GenericCamera {
  setting = {
    ip: '',
    username: '',
    password: '',
    refreshminutes: 0,

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
      result.refreshminutes = {
        type: 'select',
        title: __('Refresh picture'),
        value: this.setting.refreshminutes,
        displayvalue: this.setting.refreshminutes ? __n('%s minute', '%s minutes', this.setting.refreshminutes) : __('Never'),
        lookup: JSON.stringify({ 0: __('Never'), 1: 1, 2: 2, 3: 3, 5: 5, 10: 10, 15: 15, 30: 30, 60: 60 }).replace(/["]/g, "'"),
        error: false,
        canclear: false,
        onchange: function () { this.InitRefreshTimer() }.bind(this)
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

  lastpicture = null
  lastpicturedimension = null
  lastthumbnale = null

  GetStatusInfos() {
    const result = []
    if (!this.setting.ip) result.push({ error: true, message: __('IP address not set') })

    if (this.hikvisionModel) result.push({ message: 'Model', value: `${this.hikvisionModel} (${this.hikvisionDeviceType})` })
    if (this.hikvisionFirmware) result.push({ message: __('Version'), value: this.hikvisionFirmware })
    if (this.hikvisionDeviceName) result.push({ message: __('Name'), value: this.hikvisionDeviceName })

    if (this.lastpicture) {
      result.push({ message: __('Picture size'), value: Math.round(this.lastpicture.length / 1024) + ' kB' })
      if (this.lastpicturedimension) result.push({ message: __('Picture resolution'), value: this.lastpicturedimension + ' px' })
      if (this.lastthumbnale) {
        result.push({
          // message: __('Last picture'),
          thumbnaleurl: `/platform/security/device/${this.name}/lastthumbnale`,
          pictureurl: `/platform/security/device/${this.name}/lastpicture`
        })
      }
    } else result.push({ warning: true, message: __('Cannot get picture') })

    return result
  }

  async Start() {
    await super.Start()

    await this.InitDeviceInfo()
    await this.GetPicture()
    this.InitRefreshTimer()

    this.approuter.get(urilastpicture, this.WebLastPicture.bind(this))
    this.approuter.get(urilastthumbnale, this.WebLastThumbnale.bind(this))
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

  refreshtimer = null
  InitRefreshTimer() {
    clearInterval(this.refreshtimer)
    this.refreshtimer = null

    if (this.setting.refreshminutes) {
      this.refreshtimer = setInterval(
        function () { this.GetPicture() }.bind(this),
        this.setting.refreshminutes * 60 * 1000)
    }
  }

  async GetPicture() {
    await this.InitPictureChannel()

    this.lastpicture = null

    if (this.imagechannelid === undefined) return null
    if (this.imagechannelid < 0) return null

    const picture = await this.GetISAPI(`/ISAPI/Streaming/channels/${this.imagechannelid}/picture`, true)
    this.lastpicture = Buffer.from(picture)

    if (this.lastpicture) {
      const image = sharp(this.lastpicture)

      image
        .metadata()
        .then(metadata => { this.lastpicturedimension = `${metadata.width}x${metadata.height}` })

      image
        .resize(thumbnalesize)
        .toFormat('jpeg')
        .toBuffer()
        .then(data => { this.lastthumbnale = data })
        .catch(err => {
          this.lastthumbnale = null
          logger.warn(`[HikvisionIsapi] Cannot create thumbnail: ${err.message}`)
        })
    }

    return picture
  }

  async WebLastPicture(req, res, next) {
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': Buffer.byteLength(this.lastpicture)
    })
    res.send(this.lastpicture)
  }

  async WebLastThumbnale(req, res, next) {
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': Buffer.byteLength(this.lastthumbnale)
    })
    res.send(this.lastthumbnale)
  }
}
module.exports = HikvisionIsapi
