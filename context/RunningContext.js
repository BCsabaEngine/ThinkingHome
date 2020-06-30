const SunCalc = require('suncalc');
const vm = require('vm');
const RuleCodeLog = require.main.require("./models/RuleCodeLog");

class SunCalcDate {
  _date;

  constructor(date) {
    this._date = date;
  }

  get H() { return this._date.getHours(); }
  get M() { return this._date.getMinutes(); }
  get HHMM() { return this._date.getHours() * 100 + this._date.getMinutes(); }

  addMinutes(minutes) {
    return new SunCalcDate(new Date(this._date.getTime() + minutes * 60 * 1000));
  }
}

class RunningContext {
  _timers = {};
  _intervals = {};
  _devicestates = [];

  CreateTimeout(name, timeout, func) {
    if (this._timers[name])
      clearTimeout(this._timers[name]);

    const id = setTimeout(func, timeout);
    this._timers[name] = id;

    return new Date().getTime() + timeout;
  }

  CreateInterval(name, timeout, func) {
    if (this._intervals[name])
      clearInterval(this._intervals[name]);

    const id = setInterval(func, timeout);
    this._intervals[name] = id;
  }

  async Log(message) {
    await RuleCodeLog.Insert(message);

    global.wss.BroadcastToChannel("rulecodelog");
  }

  async Run(devicestates) {
    this._devicestates = devicestates;

    let contextvars = new class BaseContext {

      get now() {
        const d = new Date();
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
        }
      }

      getSunCalc() {
        if (!systemsettings.Latitude && !systemsettings.Longitude)
          throw new Error("Coordinates are not set, Sun not available");

        return SunCalc.getTimes(new Date(), systemsettings.Latitude, systemsettings.Longitude);
      }

      get dawn() { return new SunCalcDate(this.getSunCalc().dawn); }
      get sunrise() { return new SunCalcDate(this.getSunCalc().sunrise); }
      get sunset() { return new SunCalcDate(this.getSunCalc().sunset); }
      get dusk() { return new SunCalcDate(this.getSunCalc().dusk); }

    };

    contextvars["SunCalcDate"] = SunCalcDate;
    contextvars["log"] = this.Log.bind(this);
    contextvars["createInterval"] = this.CreateInterval.bind(this);
    contextvars["createTimeout"] = this.CreateTimeout.bind(this);
    for (var key in devicestates)
      contextvars[key] = devicestates[key];

    try {
      const jscode = await require.main.require("./models/RuleCode").FindLastJsCode() || "";

      const context = vm.createContext(contextvars);
      new vm.Script(jscode, { filename: "rulecode.js" }).runInContext(context);

      return null;
    }
    catch (err) { return err; }
  }

  Stop() {
    for (var key in this._devicestates)
      this._devicestates[key].ReleaseListeners();

    Object.keys(this._timers).forEach(function (key) {
      clearTimeout(this._timers[key]);
    }.bind(this));

    Object.keys(this._intervals).forEach(function (key) {
      clearInterval(this._intervals[key]);
    }.bind(this));
  }
}

module.exports = RunningContext;
