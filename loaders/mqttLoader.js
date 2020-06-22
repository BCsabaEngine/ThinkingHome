const logger = requireRoot("/lib/logger");
const config = requireRoot('/lib/config');
const mqtt = require('mqtt');

module.exports = () => {
  const mqttconfig = config.mqtt;
  const options = {
    host: 'mqtt://' + mqttconfig.server,
    port: mqttconfig.port,
    clientId: mqttconfig.clientid + Math.random().toString(16).substr(2, 8),
    username: mqttconfig.username,
    password: mqttconfig.password,
    keepalive: mqttconfig.keepalive,
    reconnectPeriod: 500,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    clean: true,
    encoding: 'utf8'
  }

  const client = mqtt.connect(options.host, options);

  client.on('error', function (err) {
    logger.debug("[MQTT] Error: %s", err.message);
  });

  client.on('connect', function () {
    logger.info("[MQTT] Connected to %s:%s user '%s' alias '%s' (timeout: %ds)", client.options.host, client.options.port, client.options.username, client.options.clientId, client.options.keepalive);
  });

  global.mqtt = client;

  return client;
}
