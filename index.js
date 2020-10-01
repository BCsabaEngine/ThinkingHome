global.noop = () => {   };
global.IsProduction = (process.env.NODE_ENV == 'production');
global.config = require('./config');
global.logger = require("./lib/logger");
const dayjsLoader = require('./lib/dayjsLoader');
const SystemSettings = require("./lib/systemSettings");
const database = require("./lib/database");
const http = require('./lib/http');
const webSocket = require('./lib/webSocket');

logger.info("Application starting");
logger.version();
dayjsLoader();

const db = global.db = database(() => {
  const systemsettings = global.systemsettings = new SystemSettings();
  systemsettings
    .Init()
    .then(() => {
      global.app = http();
      global.wss = webSocket(httpserver);

      const RunningContext = require('./lib/runningContext');
      global.runningContext = new RunningContext();
      runningContext.Start();
    });
});

// setTimeout(() => {
//   const d = runningContext.GetDevices().find(i => i.name == "tasmtest");
//   console.log(d);
//   d.power2.on('update', (entity, value) => {
//     console.log("XXXX");
//     console.log(entity.code);
//     console.log(value);
//   })
// }, 2000);

process.on('SIGINT', async function () {
  logger.info("Quit signal...");
  if (global.runningContext) await global.runningContext.Stop();
  if (global.httpserver) global.httpserver.close();
  process.exit(1);
});
