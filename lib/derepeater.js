class Derepeater {
  interval = 0;
  constructor(interval = 250) { this.interval = interval }

  RemoveExpired() {
    const items =
      Object.getOwnPropertyNames(this)
        .filter(item => item.startsWith('drptr_'))
    const maxage = Date.now()

    for (const item of items) {
      if (this[item] < maxage) delete this[item]
    }
  }

  Add(element, func, ...args) {
    this.RemoveExpired()

    const id = `drptr_${element}`
    if (!Object.prototype.hasOwnProperty.call(this, id)) func(args)
    this[id] = Date.now() + this.interval
  }
}

module.exports = Derepeater
