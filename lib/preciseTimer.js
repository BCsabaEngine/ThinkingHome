const EventEmitter = require('events')
const dayjs = require('dayjs')

class PreciseTimer extends EventEmitter {
  _timer = null
  lastMinute = new Date()
  lastHour = new Date()

  constructor() {
    super()

    this._timer = setInterval(this.OnTick.bind(this), 1000)
  }

  destroy() {
    this.removeAllListeners()
    clearInterval(this._timer)
  }

  OnTick() {
    const minuteformat = 'YYYYMMDDHHmm'
    if (dayjs(this.lastMinute).format(minuteformat) < dayjs().format(minuteformat)) {
      this.lastMinute = new Date()
      this.emit('minute')
    }

    const hourformat = 'YYYYMMDDHH'
    if (dayjs(this.lastHour).format(hourformat) < dayjs().format(hourformat)) {
      this.lastHour = new Date()
      this.emit('hour')
    }
  }
}

module.exports = PreciseTimer
