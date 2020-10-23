module.exports = {

  SendZigbeeMqtt(topic, message) {
    if (global.runningContext.platforms) {
      const mqtt = global.runningContext.platforms.mqtt
      if (!mqtt) {
        logger.warn('[Zigbee intercom] Mqtt platform not found or not enabled')
        return
      }

      mqtt.SendZigbeeMessage(topic, message)
    }
  },

  ZigbeeMqttReceived(topic, message) {
    if (global.runningContext.platforms) {
      const zigbee = global.runningContext.platforms.zigbee
      if (!zigbee) {
        logger.warn('[Zigbee intercom] Zigbee platform not found or not enabled')
        return
      }

      const delegated = zigbee.OnMessage(topic, message)
      if (!delegated) { logger.warn(`[Zigbee intercom] No device found for topic '${topic}'`) }
    }
  }

}
