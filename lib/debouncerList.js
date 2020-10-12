class DebouncerList {
  interval = 0;
  constructor(interval = 250) { this.interval = interval }

  debounce(func) {
    let timeout, args, context, timestamp, result

    function later() {
      const last = Date.now() - timestamp

      if (last < this.interval && last >= 0) {
        timeout = setTimeout(later, this.interval - last)
      } else {
        result = func.apply(context, args)
        timeout = context = args = null
      }
    }

    return () => {
      context = this
      // eslint-disable-next-line prefer-rest-params
      args = arguments
      timestamp = Date.now()
      if (!timeout) { timeout = setTimeout(later, this.interval) }
      return result
    }
  }

  Add(name, func, ...args) {
    const id = `dbnc_${name}`

    if (!this[id]) { this[id] = this.debounce(func) }

    this[id](...args)
  }
}

module.exports = DebouncerList
