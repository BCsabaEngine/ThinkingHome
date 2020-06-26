const logger = requireRoot("/lib/logger");
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
