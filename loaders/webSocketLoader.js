const logger = requireRoot("/lib/logger");
const WebSocket = require('ws');

module.exports = (httpserver) => {
  // Start WebSocket server
  const wss = new WebSocket.Server({ server: httpserver }, () => {
    logger.info("[WS] WebSocketServer listening")
  });

  wss.BroadcastToChannel = function (channel, message = '') {
    if (!message)
      message = {};
    message.channel = channel;

    json = JSON.stringify(message);

    logger.debug("[WS] Message '%s' to channel '%s'", json, channel);
    wss.clients.forEach(function each(client) {
      if (client.IsSubscribedTo(channel))
        client.send(json);
    });
  };

  wss
    .on('connection', function connection(ws, request) {
      logger.debug("[WS] Client connected from IP %s", request.socket.remoteAddress);

      ws.channels = [];
      ws.SubscribeTo = function (channel) {
        if (!this.IsSubscribedTo(channel))
          this.channels.push(channel);
      }
      ws.UnsubscribeFrom = function (channel) {
        if (this.IsSubscribedTo(channel))
          while (pos = this.channels.indexOf(channel))
            this.channels.splice(pos, 1);
      }
      ws.IsSubscribedTo = function (channel) {
        return (this.channels.indexOf(channel) >= 0);
      }

      ws.on('message', function incoming(msg) {
        logger.debug("[WS] Received message %s", msg);

        let msgdata = null;
        try { msgdata = JSON.parse(msg); }
        catch { logger.error("[WS] Invalid JSON %s", msg); }

        try {
          switch (msgdata.command) {

            case 'subscribe':
              if (msgdata.channel)
                ws.SubscribeTo(msgdata.channel);
              break;

            case 'unsubscribe':
              if (msgdata.channel)
                ws.UnsubscribeTo(msgdata.channel);
              break;

            default:
              logger.warn("[WS] Invalid command '%s'", msgdata.command);
              break;
          }
        }
        catch (ex) { logger.error("[WS] JSON command '%s' error %s", msgdata.command, ex); }
      });
    })


  global.wss = wss;

  return wss;
}
