const linefeed = require('os').EOL
const fs = require('fs')
const got = require('got')
const ipUtils = require('./ipUtils')

module.exports = {
  _ips: [],
  _whitelist: [],

  comparer: function (element, needle) { return element - needle },

  loadFromFile: function (filename) {
    const lines = fs.readFileSync(filename)
      .toString()
      .split(linefeed)
      .filter(function (row) { return row !== '' && !row.startsWith('#') })

    for (const line of lines) {
      const match = line.match(/([0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})/)
      if (match) { this._ips.push(match[1]) }
    }
  },

  retrieveFromUrl: async function (url) {
    const response = await got(url)
    const responselines = response.body
      .split('\n')
      .filter(function (row) { return row !== '' && !row.startsWith('#') })

    for (const line of responselines) {
      const match = line.match(/^([0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})/)
      if (match) { this._ips.push(match[1]) }
    }
  },

  buildBlackList: async function (settings) {
    for (const blacklist of settings.blackLists) {
      if (fs.existsSync(blacklist)) {
        this.loadFromFile(blacklist)
      } else if (blacklist.startsWith('http')) {
        await this.retrieveFromUrl(blacklist)
      }
    }

    this._ips.sort(this.comparer)

    logger.info('[BlackList] Initialized with ' + this._ips.length + ' IP addresses')
  },

  check: function (settings) {
    this.buildBlackList(settings)
    setInterval(function () { this._whitelist = [] }.bind(this), settings.whiteListLifeTimeMs)

    const hook = function (request, response, next) {
      const requestip = ipUtils.remoteip(request)
      if (this._whitelist.includes(requestip)) { next() } else {
        const isbanned = this._ips.includes(requestip)
        if (isbanned) {
          if (typeof settings.onFailRequest === 'function') settings.onFailRequest(requestip)
          return
        } else {
          this._whitelist.push(requestip)
        }
        next()
      }
    }.bind(this)

    return hook
  }

}
