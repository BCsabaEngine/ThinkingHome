const mqtt = require('mqtt')

module.exports = () => {
  const options = {
    host: 'mqtt://' + config.mqtt.server,
    port: config.mqtt.port,
    clientId: config.mqtt.clientid + Math.random().toString(10).substr(0, 10),
    username: config.mqtt.username,
    password: config.mqtt.password,
    keepalive: 30,
    reconnectPeriod: 500,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    clean: true,
    encoding: 'utf8'
  }

  const client = mqtt.connect(options.host, options)

  client.on('error', function (err) { logger.error(`[MQTT] Error: ${err.message}`) })

  client.on('connect', function () {
    logger.info('[MQTT] Connected to %s:%s@%s(timeout: %ds)', client.options.host, client.options.port, client.options.username, client.options.keepalive)
    client.subscribe('#', function (err) {
      if (err) {
        logger.error('[MQTT] Cannot subscribe to #: %s', err.message)
        client.end()
      }
    })
  })

  return client
}
