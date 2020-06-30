const config = require.main.require('./lib/config');
const mysql = require('mysql-plus');

module.exports = (onready) => {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: config.database.server,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: config.database.schema,
    plusOptions: {
      migrationStrategy: 'alter',
      allowAlterInProduction: true,
      debug: true,
    },
  });
  global.db = pool;

  pool.query('SHOW VARIABLES LIKE "version"', function (err, rows) {
    if (err) {
      logger.error(err);
      process.exit();
    }
    if (rows) {
      logger.info("[DB] Database engine started: %s", rows[0].Value);

      require.main.require('./models')();
      logger.debug("[DB] Models loaded");

      db.sync((err) => {
        if (err) throw err;

        const User = require('../models/User');
        User.InsertAdminIfNotExists()

        onready();
      });
    }
    else {
      logger.info("[DB] Database engine: %s", "Unknown");
      process.exit();
    }
  });

  return pool;
}
