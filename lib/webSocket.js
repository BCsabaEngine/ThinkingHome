const WebSocket = require('ws')

module.exports = (httpserver) => {
  // Start WebSocket server
  const wss = new WebSocket.Server({ server: httpserver })
  logger.info('[WS] WebSocketServer initialized')

  wss.BroadcastToChannel = function (channel, message = {}) {
    message.channel = channel

    const json = JSON.stringify(message)

    logger.debug("[WS] Message '%s' to channel '%s'", json, channel)
    for (const client of wss.clients) {
      if (client.IsSubscribedTo(channel)) { client.send(json) }
    }
  }

  wss
    .on('connection', function connection(ws, request) {
      logger.debug('[WS] Client connected from IP %s', request.socket.remoteAddress)

      ws.channels = []
      ws.SubscribeTo = function (channel) {
        if (!this.IsSubscribedTo(channel)) {
          logger.debug('[WS] Client subscribed to %s', channel)
          this.channels.push(channel)
        }
      }
      ws.UnsubscribeFrom = function (channel) {
        if (this.IsSubscribedTo(channel)) {
          while (this.channels.indexOf(channel)) { this.channels.splice(this.channels.indexOf(channel), 1) }
          logger.debug('[WS] Client unsubscribed from %s', channel)
        }
      }
      ws.IsSubscribedTo = function (channel) {
        return (this.channels.indexOf(channel) >= 0)
      }

      ws.on('message', function incoming(msg) {
        let msgdata = null
        try { msgdata = JSON.parse(msg) } catch { logger.error('[WS] Invalid JSON %s', msg) }

        try {
          switch (msgdata.command) {
            case 'subscribe':
              if (msgdata.channel) { ws.SubscribeTo(msgdata.channel) }
              break

            case 'unsubscribe':
              if (msgdata.channel) { ws.UnsubscribeTo(msgdata.channel) }
              break

            default:
              logger.warn("[WS] Invalid command '%s'", msgdata.command)
              break
          }
        } catch (ex) { logger.error("[WS] JSON command '%s' error %s", msgdata.command, ex) }
      })
    })

  return wss
}
