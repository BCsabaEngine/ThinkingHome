module.exports = {
    thousand(s) {
        return (s || '').toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    },

    truncate(str, length) {
        const strvalue = (str || '')
        return (strvalue.length <= length) ? strvalue : strvalue.substring(0, length) + '...'
    },

    middlemask(str, maskpercent = 75) {
        const strvalue = (str || '')
        if (!strvalue.length) return '-'

        const maskperc = Math.min(Math.max(maskpercent, 10), 100 - 10)
        const strlength = strvalue.length
        const prepostlength = strlength * (100 - maskperc) / 100 / 2
        return strvalue.substring(0, prepostlength) + '···' + strvalue.substring(strlength - prepostlength)
    },

    box(value) {
        const obj = (typeof value === 'object') ? value : { value: value }
        return JSON.stringify(obj, (key, value) => typeof value === 'bigint' ? value.toString() : value)
    },

    unbox(value) {
        try {
            const obj = JSON.parse(value)
            if (obj === null) return null

            const keys = Object.keys(obj)
            if (keys.length === 1 && keys[0] === 'value') return obj.value

            return obj
        } catch { return value }
    }
}
