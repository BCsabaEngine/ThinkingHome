module.exports = {
    objectToString(obj) {
        let result = ''
        for (const p in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, p)) {
                let value = obj[p]
                if (typeof value === typeof {}) value = this.objectToString(value)
                result += p + ': ' + value + ', '
            }
        }
        return result
    },

    getFunctionArgs(func) {
        const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,)]*))/mg
        const ARGUMENT_NAMES = /([^\s,]+)/g

        const fnStr = func.toString().replace(STRIP_COMMENTS, '')
        const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES)

        if (result !== null) return result

        return []
    }
}
