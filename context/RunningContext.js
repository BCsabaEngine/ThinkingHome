const logger = requireRoot("/lib/logger");
const SunCalc = require('suncalc');
const vm = require('vm');

class RunningContext {
  _timers = {};
  _intervals = {};
  _devicestates = [];

  CreateTimeout(name, timeout, func) {
    if (this._timers[name])
      clearTimeout(this._timers[name]);

    const id = setTimeout(func, timeout);
    this._timers[name] = id;

    return id;
  }

  CreateInterval(name, timeout, func) {
    if (this._intervals[name])
      clearInterval(this._intervals[name]);

    const id = setInterval(func, timeout);
    this._intervals[name] = id;

    return id;
  }

  async Log(message) {
    const RuleCodeLog = requireRoot("/models/RuleCodeLog");
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

      get sunmoon() {
        if (!systemsettings.Latitude && !systemsettings.Longitude)
          throw new Error("Coordinates are not set, SunMoon not available");

        const suncalc = SunCalc.getTimes(new Date(), systemsettings.Latitude, systemsettings.Longitude);
        return {
          dawn: {
            date: suncalc.dawn,
            H: suncalc.dawn.getHours(),
            M: suncalc.dawn.getMinutes(),
            HHMM: suncalc.dawn.getHours() * 100 + suncalc.dawn.getMinutes(),
          },
          sunrise: {
            date: suncalc.sunrise,
            H: suncalc.sunrise.getHours(),
            M: suncalc.sunrise.getMinutes(),
            HHMM: suncalc.sunrise.getHours() * 100 + suncalc.sunrise.getMinutes(),
          },
          sunset: {
            date: suncalc.sunset,
            H: suncalc.sunset.getHours(),
            M: suncalc.sunset.getMinutes(),
            HHMM: suncalc.sunset.getHours() * 100 + suncalc.sunset.getMinutes(),
          },
          dusk: {
            date: suncalc.dusk,
            H: suncalc.dusk.getHours(),
            M: suncalc.dusk.getMinutes(),
            HHMM: suncalc.sunset.getHours() * 100 + suncalc.sunset.getMinutes(),
          },
        }
      }

    };
    contextvars["log"] = this.Log.bind(this);
    contextvars["createInterval"] = this.CreateInterval.bind(this);
    contextvars["createTimeout"] = this.CreateTimeout.bind(this);
    for (var key in devicestates)
      contextvars[key] = devicestates[key];

    try {
      const jscode = await requireRoot("/models/RuleCode").FindLastJsCode() || "";

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
