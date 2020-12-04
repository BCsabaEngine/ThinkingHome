const path = require('path')
const i18n = require('i18n')

i18n.configure({
  locales: ['en', 'hu'],
  defaultLocale: 'en',
  header: 'accept-language',

  directory: path.join(__dirname, '../locales'),
  updateFiles: true,
  autoReload: !global.IsProduction,
  objectNotation: true,

  register: global
})

module.exports = (app) => {
  app.use(i18n.init)
  app.use(function (req, res, next) {
    res.locals.__ = function (...args) { return i18n.__.apply(req, args) }
    return next()
  })
}
