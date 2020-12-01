const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')

const Device = require('../Device')
const Platform = require('../Platform')
const DeviceModel = require('../../models/Device')
const TelegramDevice = require('./TelegramDevice')
const arrayUtils = require('../../lib/arrayUtils')

const http500 = 500

class TelegramPlatform extends Platform {
  bot = null;
  telegram = null;

  setting = {
    bottoken: '',

    toDisplayList: function () {
      const result = {}

      result.bottoken = {
        type: 'text',
        title: 'Bot token',
        value: this.setting.bottoken,
        displayvalue: this.setting.bottoken ? `${this.setting.bottoken.substr(0, 10)}...[${this.setting.bottoken.length}]` : '',
        error: !this.setting.bottoken,
        canclear: false,
        onchange: function () { this.InitBot() }.bind(this)
      }

      return result
    }.bind(this)
  };

  InitBot() {
    if (!this.setting.bottoken) return

    this.bot = new Telegraf(this.setting.bottoken)
    this.telegram = new Telegram(this.setting.bottoken)

    logger.debug(`[Platform] Telegram bot created with token ${this.setting.bottoken}`)

    this.bot.command('chatid', (ctx) => {
      if (ctx && ctx.message) {
        const fromid = ctx.message.from.id
        const chatid = ctx.message.chat.id
        ctx.reply(`Hello @${ctx.message.from.username}!\nDetecting chat ID... please wait`)

        setTimeout(function () {
          if (chatid === fromid) {
            ctx.replyWithMarkdown(`This is a private chat with you, the chat ID is: *${chatid}*`)
          } else {
            ctx.replyWithMarkdown(`This is a group chat, the chat ID is: * ${chatid}*`)
          }
        }, 3 * 100)
      } else ctx.reply('Invalid chat context')
    })

    this.bot.on('text', (ctx) => {
      // ctx.replyWithMarkdown(`Unknown command: *${ctx.message.text}*`);
    })

    this.telegram
      .setMyCommands(JSON.stringify([
        { command: 'chatid', description: 'Get chat ID...' }
      ]))
      .then(() => this.bot.launch())
  }

  SendMessage(chatid, message) {
    if (!this.telegram) return

    this.telegram.sendMessage(chatid, message)
  }

  GetStatusInfos() {
    let result = []
    if (!this.setting.bottoken) result.push({ error: true, message: 'Bot token not set' })
    const statusinfos = super.GetStatusInfos()
    if (Array.isArray(statusinfos)) { result = result.concat(statusinfos) }
    return result
  }

  async Start() {
    this.approuter.get('/', this.WebMainPage.bind(this))
    this.approuter.post('/adddevice', this.WebAddDevice.bind(this))
    this.approuter.post('/deletedevice', this.WebDeleteDevice.bind(this))

    for (const device of await DeviceModel.GetPlatformDevicesSync(this.GetCode())) { await this.CreateAndStartDevice(device.Type, device.Id, device.Name) }

    await super.Start()

    this.InitBot()

    logger.info(`[Platform] ${this.constructor.name} started with ${this.devices.length} device(s)`)
  }

  async Stop() {
    this.bot = null
    this.telegram = null

    await super.Stop()
  }

  async CreateAndStartDevice(type, id, name) {
    try {
      const deviceobj = TelegramDevice.CreateByType(type, id, this, name)
      await deviceobj.Start()
      this.devices.push(deviceobj)
      arrayUtils.sortByProperty(this.devices, 'name')

      this.approuter.use(`/device/${name}`, deviceobj.approuter)
      logger.debug(`[Platform] Device created ${this.GetCode()}.${type}=${name}`)
      return deviceobj
    } catch (err) {
      logger.error(`[Platform] Cannot create device because '${err.message}'`)
    }
  }

  async StopAndRemoveDevice(id) {
    try {
      for (let i = 0; i < this.devices.length; i++) {
        const device = this.devices[i]
        if (device.id === id) {
          await device.Stop()
          global.app.remove(device.approuter, this.approuter)
          this.devices.splice(i, 1)
          logger.debug(`[Platform] Device deleted ${this.GetCode()}`)
          break
        }
      }
    } catch (err) {
      logger.error(`[Platform] Cannot delete device because '${err.message}'`)
    }
  }

  WebMainPage(req, res, next) {
    const maxitemswithoutgrouping = 6

    arrayUtils.sortByProperty(this.devices, 'name')
    const devicegroups = this.devices.length > maxitemswithoutgrouping ? arrayUtils.groupByFn(this.devices, (device) => device.constructor.name.replace('Presence', ''), { itemsortproperty: 'name' }) : null

    res.render('platforms/telegram/main', {
      title: 'Telegram platform',
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: TelegramDevice.GetTypes(),
      autodevices: []
    })
  }

  async WebAddDevice(req, res, next) {
    const type = req.body.type
    const name = req.body.name.toLowerCase()
    const settings = req.body.settings

    if (!Device.IsValidDeviceName(name)) { return res.status(http500).send(`Invalid device name: '${name}`) }

    const id = await DeviceModel.InsertSync(name, this.GetCode(), type)

    const deviceobj = await this.CreateAndStartDevice(type, id, name)

    if (settings) {
      for (const key of Object.keys(settings)) { deviceobj.AdaptSetting(key, settings[key]) }
    }

    res.send(name)
  }

  async WebDeleteDevice(req, res, next) {
    const id = Number.parseInt(req.body.id)

    await DeviceModel.DeleteSync(id, this.GetCode())

    await this.StopAndRemoveDevice(id)

    res.send('OK')
  }

  static GetHandlerCount() { return Object.keys(TelegramDevice.GetTypes()).length }
  GetCode() { return TelegramPlatform.GetCode() }
  GetName() { return TelegramPlatform.GetName() }
  GetDescription() { return TelegramPlatform.GetDescription() }
  static GetPriority() { return '110' }
  static GetCode() { return 'telegram' }
  static GetName() { return 'Telegram' }
  static GetDescription() { return 'Chat, bot and notification' }
}
module.exports = TelegramPlatform
