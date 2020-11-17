class ExpirationQueue {
  items = []

  get size() {
    this.maintenance()
    return this.items.length
  }

  get empty() {
    return this.size === 0
  }

  maintenance() {
    const now = new Date().getTime()

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i]
      if (item.expiration && item.expiration < now) this.items.splice(i, 1)
    }
  }

  add(item, expiration = 0) {
    this.items.push({ value: item, expiration: expiration ? new Date().getTime() + expiration : 0 })
    this.maintenance()
  }

  get() {
    this.maintenance()

    if (!this.items.length) return null

    return this.items.shift().value
  }
}

module.exports = ExpirationQueue
