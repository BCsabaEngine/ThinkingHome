require('./lib/requireRoot'); //allow require relative to project root

const logger = requireRoot("/lib/logger");
const SystemSettings = requireRoot("/lib/systemSettings");

const databaseLoader = requireRoot('/loaders/databaseLoader');
const mqttLoader = requireRoot('/loaders/mqttLoader');
const webSocketLoader = requireRoot('/loaders/webSocketLoader');
const httpSrvLoader = requireRoot('/loaders/httpSrvLoader');
const contextHandler = requireRoot('/lib/contextHandler');
const jobs = requireRoot('/jobs');

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