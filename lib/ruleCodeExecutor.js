const vm = require('vm')
const SunCalc = require('suncalc')
const dayjs = require('dayjs')

const OccurenceEventModel = require('../models/OccurenceEvent')

class SunCalcDate {
  _date = new Date()

  constructor(date) { this._date = date }

  get H() { return this._date.getHours() }
  get M() { return this._date.getMinutes() }
  get HHMM() { return this._date.getHours() * 100 + this._date.getMinutes() }
  // eslint-disable-next-line no-magic-numbers
  get HH_MM() { return this._date.getHours() + ':' + this._date.getMinutes().toString().padStart(2, '0') }

  addMinutes(minutes) { return new SunCalcDate(new Date(this._date.getTime() + minutes * 60 * 1000)) }
}

class OnceADay {
  _name = '';
  _dailyoccurences = {};

  occured() {
    this.addOccurenceInternal()
    OccurenceEventModel.InsertSync(this._name)
  }

  addOccurenceInternal(datetime = null) {
    const date = dayjs(datetime || new Date()).format('YYYY-MM-DD')
    if (!Object.prototype.hasOwnProperty.call(this._dailyoccurences, date)) {
      this._dailyoccurences[date] = 1
    } else {
      this._dailyoccurences[date] = this._dailyoccurences[date] + 1
    }
  }

  get hasoccured() {
    const date = dayjs().format('YYYY-MM-DD')
    if (Object.prototype.hasOwnProperty.call(this._dailyoccurences, date)) return this._dailyoccurences[date]
    return 0
  }

  async loadoccurences() {
    for (const today of await OccurenceEventModel.GetFromToday(this._name)) this.addOccurenceInternal(today.DateTime.getTime())
  }

  constructor(name) {
    this._name = name
    this.loadoccurences()
  }
}

class RuleCodeExecutor {
  static ParseJsCode(jscode) {
    const devices = []
    for (const device of global.runningContext.GetDevices()) {
      if (jscode.includes(device.name)) {
        if (!devices.includes(device.name)) devices.push(device.name)
      }
    }
    devices.sort()

    const keywords = []
    for (const keyword of [
      'atEveryMinute(', 'atEveryHour(',
      'createInterval(', 'clearInterval(', 'createTimeout(', 'clearTimeout(',
      'now.', 'dawn.', 'sunrise.', 'sunset.', 'dusk.',
      'OnceADay('
    ]) {
      if (jscode.includes(keyword)) {
        const kw = keyword.replace(/[(.]/g, '')
        if (!keywords.includes(kw)) keywords.push(kw)
      }
    }

    return { devices: devices, keywords: keywords }
  }

  _timers = {};
  _intervals = {};
  _everyminutes = [];
  _everyhours = [];
  _devices = [];
  _console = [];

  id = null;
  name = '';
  jscode = '';
  constructor(id, name, jscode) {
    this.id = id
    this.name = name
    this.jscode = jscode
  }

  CreateTimeout(name, timeout, func) {
    if (this._timers[name]) { clearTimeout(this._timers[name]) }

    const id = setTimeout(func, timeout)
    this._timers[name] = id

    return new Date().getTime() + timeout
  }

  ClearTimeout(name) {
    if (this._timers[name]) {
      clearTimeout(this._timers[name])
      delete this._timers[name]
    }
  }

  CreateInterval(name, timeout, func) {
    if (this._intervals[name]) { clearInterval(this._intervals[name]) }

    const id = setInterval(func, timeout)
    this._intervals[name] = id
  }

  ClearInterval(name) {
    if (this._intervals[name]) {
      clearInterval(this._intervals[name])
      delete this._intervals[name]
    }
  }

  AtEveryMinute(func) { this._everyminutes.push(func) }

  AtEveryHour(func) { this._everyhours.push(func) }

  Console(message) {
    const messageline = dayjs().format('HH:mm:ss ') + message
    this._console.push(messageline)
    while (this._console.length > 100) { this._console.shift() }

    global.wss.BroadcastToChannel('rulecodelog')
  }

  Log(message) {
    const RuleCodeLogModel = require('../models/RuleCodeLog')
    RuleCodeLogModel.Insert(this.id, message)
      .then(() => {
        global.wss.BroadcastToChannel('rulecodelog')
      })
  }

  DoEveryMinute() { for (const everyminute of this._everyminutes) if (typeof everyminute === 'function') everyminute() }
  DoEveryHour() { for (const everyhour of this._everyhours) if (typeof everyhour === 'function') everyhour() }

  GetConsoleLines() { return this._console }
  async Run() {
    // eslint-disable-next-line new-parens
    const contextvars = new class BaseContext {
      get now() {
        const d = new Date()
        return {
          y: d.getFullYear(),
          m: d.getMonth() + 1,
          d: d.getDate(),
          H: d.getHours(),
          M: d.getMinutes(),
          S: d.getSeconds(),
          dow: d.getDay(),
          time: d.getTime(),
          HHMM: d.getHours() * 100 + d.getMinutes(),
          // eslint-disable-next-line no-magic-numbers
          HH_MM: d.getHours() + ':' + d.getMinutes().toString().padStart(2, '0')
        }
      }

      getSunCalc() { return SunCalc.getTimes(new Date(), systemsettings.Latitude, systemsettings.Longitude) }

      get dawn() { return new SunCalcDate(this.getSunCalc().dawn) }
      get sunrise() { return new SunCalcDate(this.getSunCalc().sunrise) }
      get sunset() { return new SunCalcDate(this.getSunCalc().sunset) }
      get dusk() { return new SunCalcDate(this.getSunCalc().dusk) }
    }

    contextvars.SunCalcDate = SunCalcDate
    contextvars.OnceADay = OnceADay
    contextvars.console = this.Console.bind(this)
    contextvars.log = this.Log.bind(this)
    contextvars.createInterval = this.CreateInterval.bind(this)
    contextvars.clearInterval = this.ClearInterval.bind(this)
    contextvars.createTimeout = this.CreateTimeout.bind(this)
    contextvars.clearTimeout = this.ClearTimeout.bind(this)
    contextvars.atEveryMinute = this.AtEveryMinute.bind(this)
    contextvars.atEveryHour = this.AtEveryHour.bind(this)

    this._devices = global.runningContext.GetDevices()
    for (const device of this._devices) { contextvars[device.name] = device }

    try {
      const context = vm.createContext(contextvars)
      new vm.Script(this.jscode, { filename: `${this.name}.js` }).runInContext(context)

      logger.info(`[RuleCodeExecutor] ${this.name} started`)
    } catch (err) {
      global.runningContext.ReportRuleCodeExecutorError(this.id, err)
      logger.error(`[RuleCodeExecutor] ${this.name} failed: ${err.message}`)
    }
  }

  Stop() {
    for (const device of this._devices) { device.RemoveAllListeners() }

    Object.keys(this._timers).forEach(function (key) {
      clearTimeout(this._timers[key])
    }.bind(this))

    Object.keys(this._intervals).forEach(function (key) {
      clearInterval(this._intervals[key])
    }.bind(this))

    logger.info(`[RuleCodeExecutor] ${this.name} started`)
  }
}

module.exports = RuleCodeExecutor
