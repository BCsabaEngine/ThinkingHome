const ipUtils = require('./ipUtils')

module.exports = {
  _banlist: {},
  _window404: {},
  _windowsizesec: 60,
  _windowcount: 10,
  _permitsec: 10 * 60,

  ban: function (ip) {
    if (!Object.prototype.hasOwnProperty.call(this._banlist, ip)) {
      this._banlist[ip] = new Date().getTime()
    }
  },

  add404: function (request) {
    const requestip = ipUtils.remoteip(request)
    const wtime = Math.floor(new Date().getTime() / 1000 / this._windowsizesec)

    if (!Object.prototype.hasOwnProperty.call(this._window404, requestip)) this._window404[requestip] = {}
    if (!Object.prototype.hasOwnProperty.call(this._window404[requestip], wtime)) this._window404[requestip][wtime] = 0

    this._window404[requestip][wtime] = this._window404[requestip][wtime] + 1

    if (this._window404[requestip][wtime] >= this._windowcount) {
      this.ban(requestip)
      delete this._window404[requestip]
    }
  },

  check: function (settings) {
    setInterval(function () {
      const now = new Date().getTime()
      for (const ip of Object.keys(this._banlist)) {
        if (this._banlist[ip] < now - this._permitsec * 1000) {
          delete this._banlist[ip]
          if (typeof settings.onPermit === 'function') settings.onPermit(ip)
        }
      }
    }.bind(this), this._permitsec * 1000 / 10)
    const hook = function (request, response, next) {
      const requestip = ipUtils.remoteip(request)
      if (Object.keys(this._banlist).includes(requestip)) {
        if (typeof settings.onBan === 'function') settings.onBan(requestip)
        return
      }
      next()
    }.bind(this)

    return hook
  }

}
