const logger = global.logger = require.main.require("./lib/logger");
const SystemSettings = require.main.require("./lib/systemSettings");

const databaseLoader = require.main.require('./loaders/databaseLoader');
const mqttLoader = require.main.require('./loaders/mqttLoader');
const webSocketLoader = require.main.require('./loaders/webSocketLoader');
const httpSrvLoader = require.main.require('./loaders/httpSrvLoader');
const contextHandler = require.main.require('./lib/contextHandler');
const jobs = require.main.require('./jobs');

logger.info("Application starting...");

// Init storage: global.db and global.db.promise
const database = databaseLoader(() => {

  // Preload SystemSettings: global.systemsettings
  const systemsettings = global.systemsettings = new SystemSettings();
  systemsettings.Init();

  // Init Express app and start: global.app + global.httpserver
  const app = httpSrvLoader();

  // Init WebSocket: global.wss
  const ws = webSocketLoader(global.httpserver);

  // Create central manager: global.context
  const context = global.context = new contextHandler();

  // Init central manager devices
  context.InitDevices(() => {
    // Init MQTT client: global.mqtt
    const mqttCli = mqttLoader();

    // Subscribe to MQTT
    context.InitMqtt(mqttCli);

    // Init scheduled jobs
    jobs();

    context.RunContext();

    logger.info("Application started, waiting for subsystems start");
  });
});