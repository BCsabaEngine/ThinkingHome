module.exports = {
    remoteip(req) {
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
        if (ip.startsWith('::ffff:')) {
            ip = ip.substr('::ffff:'.length)
        }
        return ip
    }
}
