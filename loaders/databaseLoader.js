const logger = requireRoot("/lib/logger");
const config = requireRoot('/lib/config');
const mysql = require('mysql');

module.exports = (cb) => {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: config.database.server,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: config.database.schema,
  });
  global.db = pool;

  pool.query('SHOW VARIABLES LIKE "version"', function (err, rows) {
    if (err) {
      logger.error(err);
      process.exit();
    }
    if (rows) {
      logger.info("[DB] Database engine started: %s", rows[0].Value);
      cb();
    }
    else {
      logger.info("[DB] Database engine: %s", "Unknown");
      process.exit();
    }
  });

  return pool;
}
