module.exports = {
    stringtobool(string) {
        switch ((string + '').trim().toLowerCase()) {
            case '1':
            case 't':
            case 'true':
            case 'y':
            case 'yes':
                return true
            default:
                return false
        }
    }
}
