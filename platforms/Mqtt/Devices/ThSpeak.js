const os = require('os')
const { isInSubnet } = require('subnet-check')
const got = require('got')
const FormData = require('form-data')

const { Entity } = require('../../Entity')
const { ButtonAction } = require('../../Action')
const Thinking = require('./Thinking')

class ThSpeak extends Thinking {
  get icon() { return 'fa fa-bullhorn' }
  entities = {
    speak: new Entity(this, 'speak', 'Speak', 'fa fa-bullhorn')
      .AddAction(new ButtonAction(this, 'test', 'Test speak', 'fa fa-bullhorn', async function () {
        const ids = await this.GetMp3Ids(['Szia', 'Hello', 'Sziasztok'], ['Én vagyok Csaba', 'Én apa vagyok'])
        console.log(ids)
        // this.SendCmd('playmp3', { url: 'http://brain.thinkinghome.hu/hello.mp3', volume: 10 })
      }.bind(this)))
      .AddAction(new ButtonAction(this, 'play', 'Play sentence', 'fa fa-bullhorn', (...args) => {
        // console.log(args)
      }))
  }

  setting = {
    toDisplayList: function () { return [] },
    toTitle: function () { return this.constructor.name }.bind(this),
    toSubTitle: function () { return '' }
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

  async GetMp3Id(text) {
    let keys = await this.GetDataKeys()
    for (const id of Object.keys(keys)) {
      if (keys[id] === text) return id
    }

    if (!systemsettings.CloudToken) throw new Error('Token not set')

    const form = new FormData()
    form.append('token', systemsettings.CloudToken)
    form.append('text', text)

    const mp3response = await got.post(config.brainserver.server + config.brainserver.ttsservice, { body: form })
    await this.UpdateDataByKey(text, mp3response.body)

    keys = await this.GetDataKeys()
    for (const id of Object.keys(keys)) {
      if (keys[id] === text) return id
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
