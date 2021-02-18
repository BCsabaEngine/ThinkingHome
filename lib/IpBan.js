const ipUtils = require('./ipUtils')

module.exports = {
  _banlist: new Map(),
  _window404: new Map(),

  _windowsizesec: 60,
  _windowcount: 10,
  _permitsec: 10 * 60,

  ban: function (ip) {
    this._banlist.set(ip, new Date().getTime())
  },

  add404: function (request) {
    const requestip = ipUtils.remoteip(request)
    const wtime = Math.floor(new Date().getTime() / 1000 / this._windowsizesec)

    if (!this._window404.has(requestip)) this._window404.set(requestip, new Map())
    if (!this._window404.get(requestip).has(wtime)) this._window404.get(requestip).set(wtime, 0)

    this._window404.get(requestip).set(wtime, this._window404.get(requestip).get(wtime) + 1)

    if (this._window404.get(requestip).get(wtime) >= this._windowcount) {
      this.ban(requestip)
      this._window404.delete(requestip)
    }
  },

  check: function (settings) {
    setInterval(function () {
      const now = new Date().getTime()
      for (const ip of this._banlist.keys()) {
        if (this._banlist.has(ip) && this._banlist.get(ip) < now - this._permitsec * 1000) {
          this._banlist.delete(ip)
          if (typeof settings.onPermit === 'function') settings.onPermit(ip)
        }
      }
    }.bind(this), this._permitsec * 1000 / 10)
    const hook = function (request, response, next) {
      if (!systemsettings.BanIPBy404) return next()

      const requestip = ipUtils.remoteip(request)
      if (this._banlist.has(requestip)) {
        if (typeof settings.onBan === 'function') settings.onBan(requestip)
        return
      }

      return next()
    }.bind(this)

    return hook
  }

}
