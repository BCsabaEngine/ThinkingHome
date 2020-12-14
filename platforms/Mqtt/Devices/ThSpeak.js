const os = require('os')
const fs = require('fs')
const path = require('path')
const got = require('got')
const FormData = require('form-data')
const { isInSubnet } = require('subnet-check')

const { Entity } = require('../../Entity')
const { ButtonAction } = require('../../Action')
const Thinking = require('./Thinking')

const urimp3 = '/noauth-nossl/tts-mp3'
const mp3folder = path.join(__dirname, '/SpeakMp3/')

class ThSpeak extends Thinking {
  get icon() { return 'fa fa-bullhorn' }
  entities = {
    speak: new Entity(this, 'speak', 'Speak', 'fa fa-bullhorn')
      .AddAction(new ButtonAction(this, 'test', 'Test speak', 'fa fa-bullhorn', async function () {
        const ids = await this.GetMp3Ids('Ez egy példa üzenet amely a hangerő beállítására szolgál.')
        const uri = this.GetMp3Uri(ids)
        this.SendCmd('playmp3', { url: uri, volume: 20 })
      }.bind(this)))
      .AddAction(new ButtonAction(this, 'play', 'Play sentence', 'fa fa-bullhorn', async function (...args) {
        if (args.length) {
          const ids = await this.GetMp3Ids(...args)
          const uri = this.GetMp3Uri(ids)
          this.SendCmd('playmp3', { url: uri, volume: 20 })
        }
      }.bind(this)))
  }

  setting = {
    intro: '',
    toDisplayList: function () {
      const result = {}
      const availableintros = {
        chimn: 'Chimn',
        chimnlong: 'Chimn the long',
        miracle: 'Miracle',
        spank: 'Spank',
        tada: 'Tada',
        tititi: 'Ti-Ti-Ti'
      }
      result.intro = {
        type: 'select',
        title: __('Intro sound'),
        value: this.setting.intro,
        displayvalue: function () { if (this.setting.intro) return availableintros[this.setting.intro] }.bind(this)(),
        lookup: JSON.stringify(availableintros).replace(/["]/g, "'"),
        error: false,
        canclear: true
      }
      return result
    }.bind(this),
    toTitle: function () { return this.constructor.name }.bind(this),
    toSubTitle: function () { return '' }
  }

  async Start() {
    await super.Start()

    this.approuter.get(urimp3, this.WebGetMp3.bind(this))
  }

  GetStatusInfos() {
    const result = super.GetStatusInfos()
    const ip = this.GetThinkingHomeIp()
    if (ip) { result.push({ device: this, message: __('TH IP address'), value: ip }) }
    return result
  }

  GetThinkingHomeIp() {
    if (!this.thinkingIPAddress) return ''

    const nets = os.networkInterfaces()

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal && net.cidr) {
          if (isInSubnet(this.thinkingIPAddress, net.cidr)) {
            return net.address
          }
        }
      }
    }
  }

  GetMp3Uri(ids) {
    const ip = this.GetThinkingHomeIp()

    if (!ip) return

    return `http://${ip}/platform/mqtt/device/${this.name}${urimp3}?ids=${ids.join('+')}`
  }

  async GetMp3Id(text) {
    const textlower = text.toLowerCase()

    let keys = await this.GetDataKeys()
    for (const id of Object.keys(keys)) {
      if (keys[id] === textlower) return id
    }

    if (!systemsettings.CloudToken) throw new Error('Token not set')

    const form = new FormData()
    form.append('token', systemsettings.CloudToken)
    form.append('text', textlower)

    const mp3response = await got.post(config.brainserver.server + config.brainserver.ttsservice, { body: form })
    await this.UpdateDataByKey(textlower, mp3response.rawBody.toString('base64'))

    keys = await this.GetDataKeys()
    for (const id of Object.keys(keys)) {
      if (keys[id] === textlower) return id
    }
    throw new Error('MP3 not found')
  }

  async GetMp3Ids(...args) {
    const result = []

    for (const arg of args) {
      let a = arg
      if (Array.isArray(a)) {
        const aindex = Math.floor(Math.random() * a.length)
        a = a[aindex]
      }

      result.push(await this.GetMp3Id(a))
    }

    return result
  }

  async WebGetMp3(req, res, next) {
    if (!req.query.ids) return

    const ids = req.query.ids.split(' ')

    let mp3merge = Buffer.alloc(0)

    const silence = fs.readFileSync(path.join(mp3folder, '_.mp3'))
    mp3merge = Buffer.concat([mp3merge, silence])

    if (this.setting.intro) {
      const introfile = path.join(mp3folder, this.setting.intro + '.mp3')
      if (fs.existsSync(introfile)) {
        const intro = fs.readFileSync(introfile)
        mp3merge = Buffer.concat([mp3merge, intro])
      }
    }

    for (const id of ids) {
      const mp3data = await this.GetDataById(id)
      if (mp3data) {
        const mp3buffer = Buffer.from(mp3data, 'base64')
        mp3merge = Buffer.concat([mp3merge, mp3buffer])
      }
    }

    res.set({
      'Content-Type': 'audio/mpeg3',
      'Content-Length': Buffer.byteLength(mp3merge)
    })

    res.send(mp3merge)
  }

  ProcessMessage(topic, message) {
    if (super.ProcessMessage(topic, message)) { return true }

    return false
  }

  ProcessMessageObj(topic, messageobj) {
    if (super.ProcessMessageObj(topic, messageobj)) { return true }

    return false
  }
}
module.exports = ThSpeak
