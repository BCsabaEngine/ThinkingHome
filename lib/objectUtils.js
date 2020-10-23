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
    }
}
