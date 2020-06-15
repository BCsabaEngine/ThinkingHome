const logger = requireRoot("/lib/logger");
const config = requireRoot('/lib/config');
const express = require('express');
const routeInitializer = requireRoot('/routes');

module.exports = () => {
  // Create Express app and init routes
  const app = express();
  routeInitializer(app);

  // Start HTTP server
  const server = app.listen(config.http.port, () => {
    logger.info("[HTTP] Webserver listening at http://%s:%s", server.address().address, server.address().port)
  })

  global.app = app;

  return app;
}
