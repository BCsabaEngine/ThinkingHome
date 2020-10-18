const vm = require('vm')
const SunCalc = require('suncalc')
const dayjs = require('dayjs')
const ErrorStackParser = require('error-stack-parser')

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

class RuleCodeExecutor {
  _timers = {};
  _intervals = {};
  _devices = [];
  _console = [];

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

  Console(message) {
    const messageline = dayjs().format('HH:mm:ss ') + message
    this._console.push(messageline)
    while (this._console.length > 100) { this._console.shift() }

    global.wss.BroadcastToChannel('rulecodelog')
  }

  Log(message, topic = '') {
    const RuleCodeLog = require('../models/RuleCodeLog')
    RuleCodeLog.Insert(topic, message)
      .then(() => {
        global.wss.BroadcastToChannel('rulecodelog')
      })
  }

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
    contextvars.console = this.Console.bind(this)
    contextvars.log = this.Log.bind(this)
    contextvars.createInterval = this.CreateInterval.bind(this)
    contextvars.clearInterval = this.ClearInterval.bind(this)
    contextvars.createTimeout = this.CreateTimeout.bind(this)
    contextvars.clearTimeout = this.ClearTimeout.bind(this)

    this._devices = global.runningContext.GetDevices()
    for (const device of this._devices) { contextvars[device.name] = device }

    if (!process.hasUncaughtExceptionCaptureCallback()) {
      process.setUncaughtExceptionCaptureCallback((err) => {
        const stacks = ErrorStackParser.parse(err)

        let virtualerror = false
        for (const stack of stacks) {
          if (stack.fileName === 'virtual.js') {
            global.runningContext.ReportRuleCodeExecutorError(err)
            virtualerror = true
            break
          }
        }

        if (!virtualerror) { throw err }
      })
    }

    try {
      const jscode = await require('../models/RuleCode').FindLastJsCode() || ''

      const context = vm.createContext(contextvars)
      new vm.Script(jscode, { filename: 'virtual.js' }).runInContext(context)

      logger.info('[RuleCodeExecutor] Started')
    } catch (err) {
      global.runningContext.ReportRuleCodeExecutorError(err)
      logger.error(`[RuleCodeExecutor] Failed: ${err.message}`)
    }
  }

  Stop() {
    if (process.hasUncaughtExceptionCaptureCallback()) { process.setUncaughtExceptionCaptureCallback(null) }

    for (const device of this._devices) { device.RemoveAllListeners() }

    Object.keys(this._timers).forEach(function (key) {
      clearTimeout(this._timers[key])
    }.bind(this))

    Object.keys(this._intervals).forEach(function (key) {
      clearInterval(this._intervals[key])
    }.bind(this))

    logger.info('[RuleCodeExecutor] Stopped')
  }
}

module.exports = RuleCodeExecutor
