const config = require.main.require('./lib/config');

const logger =
  require('console-log-level')
    ({
      level: config.log.debug ? 'debug' : 'info'
    });

module.exports = logger;
