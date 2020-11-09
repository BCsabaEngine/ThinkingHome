const GenericDevice = require('./GenericDevice')

class Router extends GenericDevice {
  get icon() { return 'fa fa-route' }
}
module.exports = Router
