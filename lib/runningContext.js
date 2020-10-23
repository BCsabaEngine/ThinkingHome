const DeviceModel = require('../models/Device')
const PlatformModel = require('../models/Platform')
const BoardModel = require('../models/Board')
const Platform = require('../platforms/Platform')
const OpenWeatherMap = require('../lib/openWeatherMap')
const BoardBuilder = require('../lib/boardBuilder')
const DebouncerList = require('../lib/debouncerList')
const RfInterCom = require('../lib/rfInterCom')
const IrInterCom = require('../lib/irInterCom')
const ZigbeeInterCom = require('../lib/zigbeeInterCom')

const debouncedelayms = 150

class RunningContext {
  platforms = {};
  platformticktimer = null;
  weather = null;
  rulecodeexecutor = null;
  rulecodeexecutorerror = null;
  rfInterCom = RfInterCom;
  irInterCom = IrInterCom;
  zigbeeInterCom = ZigbeeInterCom;

  IsRuleCodeExecutor() { return this.rulecodeexecutor }

  async StartRuleCodeExecutor() {
    this.StopRuleCodeExecutor()

    const RuleCodeExecutor = require('../lib/ruleCodeExecutor')
    this.rulecodeexecutor = new RuleCodeExecutor()
    await this.rulecodeexecutor.Run()
  }

  StopRuleCodeExecutor() {
    if (this.rulecodeexecutor) {
      this.rulecodeexecutor.Stop()
      this.rulecodeexecutor = null
      this.rulecodeexecutorerror = null
    }
  }

  ReportRuleCodeExecutorError(err) { this.rulecodeexecutorerror = err }

  GetRuleCodeExecutorMessage() {
    if (this.rulecodeexecutorerror) { return this.rulecodeexecutorerror.message }
    return null
  }

  GetRuleCodeExecutorStack() {
    if (this.rulecodeexecutorerror) {
      const result = []
      for (let line of this.rulecodeexecutorerror.stack.split('\n')) {
        if (line.startsWith('virtual.js:')) { line = line.replace('virtual.js:', 'At line ') }
        if (line.includes('at new Script (vm.js') || line.includes('at Script.runInContext (vm') || line.includes('at virtual.js:')) { return result.join('\n') } else { result.push(line) }
      }
      return result.join('\n')
    }
    return null
  }

  GetRuleCodeExecutorConsoleLines() {
    if (this.rulecodeexecutor) { return this.rulecodeexecutor.GetConsoleLines() }
    return []
  }

  GetPlatforms() {
    const result = []
    for (const code of Object.keys(this.platforms)) { result.push(this.platforms[code]) }
    return result
  }

  GetDevices() {
    let result = []
    for (const platform of this.GetPlatforms()) { result = result.concat(platform.devices) }
    result.sort(function (a, b) {
      if (a.name > b.name) return 1
      if (a.name < b.name) return -1
      return 0
    })
    return result
  }

  GetEntities() {
    const result = []
    for (const device of this.GetDevices()) {
      for (const entitykey of Object.keys(device.entities)) { result.push(device.entities[entitykey]) }
    }
    return result
  }

  debouncers = new DebouncerList(debouncedelayms)

  PublishEntityEvent(event, entity, args) {
    if (event !== 'change') { return }

    const platformcode = entity.device.platform.GetCode()
    const devicename = entity.device.name
    const entitycode = entity.code
    const entityvalue = args[0]

    this.debouncers.Add(`platform_${platformcode}`, () => { global.wss.BroadcastToChannel(`platform_${platformcode}`) })
    this.debouncers.Add(`device_${devicename}`, () => { global.wss.BroadcastToChannel(`device_${devicename}`) })

    global.wss.BroadcastToChannel('board', { device: devicename, entity: entitycode, value: entityvalue })
  }

  GetWarningOrErrorPlatformCount() {
    let i = 0
    for (const key of Object.keys(this.platforms)) {
      if (this.platforms[key].GetStatusInfos().filter(si => si.warning || si.error).length) { i++ }
    }
    return i
  }

  async Start() {
    logger.info('[RunningContext] Initializing...')
    global.app.get('/', this.WebMainPage)
    global.app.get('/board-:id', this.WebMainPage)
    global.app.get('/suggestdevicename', this.WebSuggestDevicename)
    global.app.get('/platform', this.WebPlatformList.bind(this))
    global.app.post('/platform/enable', this.WebPlatformEnable.bind(this))
    global.app.post('/platform/disable', this.WebPlatformDisable.bind(this))

    await this.StartEnabledPlatforms()
    global.app.re404()

    this.weather = new OpenWeatherMap()
    this.weather.on('update', () => { global.wss.BroadcastToChannel('Weather') })
    this.weather.Start()

    this.StartRuleCodeExecutor()

    logger.info('[RunningContext] started')
  }

  async Stop() {
    this.StopRuleCodeExecutor()
    await this.StopEnabledPlatforms()
    logger.info('[RunningContext] stopped')
  }

  async StartPlatform(platform) {
    const PlatformClass = platform.require()
    const platformobj = new PlatformClass()

    await platformobj.Start()
    this.platforms[platformobj.GetCode()] = platformobj

    global.app.use(`/platform/${platform.code}`, platformobj.approuter)
    global.app.re404()

    platformobj.Tick(0)
  }

  async StartEnabledPlatforms() {
    this.platforms = {}

    const enabledplatforms = await PlatformModel.GetEnabledPlatformCodesSync()

    for (const platform of Platform.GetAvailablePlatforms()) {
      if (enabledplatforms.includes(platform.code)) { await this.StartPlatform(platform) }
    }

    global.app.re404()

    for (const key of Object.keys(this.platforms)) { this.platforms[key].Tick(0) }
    this.platformticktimer = setInterval(this.TimerSeconds.bind(this), 1000)
  }

  async StopPlatform(platform) {
    if (this.platforms[platform]) {
      await this.platforms[platform].Stop()
      delete this.platforms[platform]
    }
  }

  async StopEnabledPlatforms() {
    clearInterval(this.platformticktimer)
    for (const key of Object.keys(this.platforms)) { await this.StopPlatform(key) }
  }

  TimerSeconds() {
    const seconds = Math.round(new Date().getTime() / 1000)
    for (const key of Object.keys(this.platforms)) { this.platforms[key].Tick(seconds) }
  }

  async WebMainPage(req, res) {
    const boardid = req.params.id
    const userid = req.session.user ? req.session.user.id : null

    let allboards = []
    if (userid) { allboards = await BoardModel.GetAllByUserSync(userid) } else { allboards = await BoardModel.GetAllSync() }

    let board = null
    let boardindex = -1
    for (let i = 0; i < allboards.length; i++) if (allboards[i].Id === boardid) { board = allboards[i]; boardindex = i }
    if (!board) { for (let i = 0; i < allboards.length; i++) if (allboards[i].IsPrimary) { board = allboards[i]; boardindex = i } }
    if (!board) { if (allboards.length) { board = allboards[0]; boardindex = 0 } }

    let prevboardid = 0
    let nextboardid = 0
    if (boardindex > -1 && allboards.length > 1) {
      let previndex = boardindex - 1
      if (previndex < 0) { previndex = allboards.length - 1 }
      prevboardid = allboards[previndex].Id

      let nextindex = boardindex + 1
      if (nextindex >= allboards.length) { nextindex = 0 }
      nextboardid = allboards[nextindex].Id
    }

    let content = ''
    let errorcontent = ''
    if (board) {
      try { content = new BoardBuilder(board.Yaml).Build() } catch (error) { errorcontent = error.message }
    }

    res.render('main', {
      title: board ? board.Name : 'No board',
      board: board,
      prevboardid: prevboardid,
      nextboardid: nextboardid,
      content: content,
      errorcontent: errorcontent
    })
  }

  async WebSuggestDevicename(req, res) {
    let devicename = (req.query.devicename || '').toLowerCase()
    if (devicename) { devicename = await DeviceModel.FindFirstAvailableNameSync(devicename) }
    res.send(JSON.stringify({ suggestion: devicename }))
  }

  async WebPlatformList(req, res, next) {
    const platforms = Platform.GetAvailablePlatforms()
    const enabledplatforms = await PlatformModel.GetEnabledPlatformCodesSync()
    for (const platform of platforms) {
      platform.enabled = enabledplatforms.includes(platform.code)

      platform.devicecount = 0
      platform.statusinfo = []

      const platformobj = this.platforms[platform.code]
      if (platformobj) {
        platform.devicecount = platformobj.GetDeviceCount()
        platform.statusinfos = platformobj.GetStatusInfos()
      }
    }

    res.render('platformlist', {
      title: 'Platforms',
      platforms: platforms
    })
  }

  async WebPlatformEnable(req, res, next) {
    const code = req.body.code
    const platforms = Platform.GetAvailablePlatforms()
    for (const platform of platforms) {
      if (platform.code === code) {
        await PlatformModel.EnableSync(code)
        await this.StartPlatform(platform)
      }
    }
    res.send('OK')
  }

  async WebPlatformDisable(req, res, next) {
    const code = req.body.code
    const platforms = Platform.GetAvailablePlatforms()
    for (const platform of platforms) {
      if (platform.code !== code) { continue }

      await this.StopPlatform(platform)

      await PlatformModel.DisableSync(code)
    }
    res.send('OK')
  }
}

module.exports = RunningContext
