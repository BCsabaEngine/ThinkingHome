class DebouncerList {
  interval = 0;
  constructor(interval = 250) { this.interval = interval; }

  debounce(func) {
    var timeout, args, context, timestamp, result;

    function later() {
      var last = Date.now() - timestamp;

      if (last < this.interval && last >= 0)
        timeout = setTimeout(later, this.interval - last);
      else {
        result = func.apply(context, args);
        timeout = context = args = null;
      }
    };

    return () => {
      context = this;
      args = arguments;
      timestamp = Date.now();
      if (!timeout)
        timeout = setTimeout(later, this.interval);
      return result;
    };
  }

  Add(name, func, ...args) {
    const id = `dbnc_${name}`;

    if (!this[id])
      this[id] = this.debounce(func);

    this[id](...args);
  }
}

module.exports = DebouncerList;