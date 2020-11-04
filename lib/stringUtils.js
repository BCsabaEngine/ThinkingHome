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
    }
}
