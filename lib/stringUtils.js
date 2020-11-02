module.exports = {
    thousand(s) {
        return s.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    },

    truncate(str, length) {
        return ((str || '').length <= length) ? str : str.substring(0, length) + '...'
    },

    middlemask(str, maskpercent = 75) {
        const maskperc = Math.min(Math.max(maskpercent, 10), 100 - 10)
        const strlength = (str || '').length
        const prepostlength = strlength * (100 - maskperc) / 100 / 2
        return str.substring(0, prepostlength) + '···' + str.substring(strlength - prepostlength)
    }
}
