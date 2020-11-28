global.IsProduction = (process.env.NODE_ENV === 'production')
global.config = require('./config')
const logger = global.logger = require('./lib/logger')
const dayjsLoader = require('./lib/dayjsLoader')
const SystemSettings = require('./lib/systemSettings')
const database = require('./lib/database')
const http = require('./lib/http')
const webSocket = require('./lib/webSocket')
const jobs = require('./jobs')

logger.info('Application starting')
logger.version()
dayjsLoader()

global.db = database(() => {
  const systemsettings = global.systemsettings = new SystemSettings()
  systemsettings
    .Init()
    .then(() => {
      global.app = http()
      global.wss = webSocket(global.httpsserver || global.httpserver)

      const RunningContext = require('./lib/runningContext')
      global.runningContext = new RunningContext()
      global.runningContext.Start()

      jobs()

      require('./models/SystemLog').Insert('Bootup', 'Application started')
      require('./lib/userNotify').addToAdmin(null, 0, 'fa fa-plug', 'Power on', 'ThinkingHome application started')
    })
})

process.on('SIGINT', async function () {
  const exitcode = 1

  logger.info('Quit signal...')
  if (global.runningContext) await global.runningContext.Stop()
  if (global.httpsserver) global.httpsserver.close()
  if (global.httpserver) global.httpserver.close()

  process.exit(exitcode)
})
