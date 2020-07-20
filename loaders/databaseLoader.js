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

      db.sync(async function (err) {
        if (err) throw err;

        for (const tableDefinition of db._tables.values())
          if (tableDefinition._schema.triggers)
            Object.keys(tableDefinition._schema.triggers).forEach(async function (triggername) {

              const triggercode = tableDefinition._schema.triggers[triggername];

              logger.debug(`[DB] Drop trigger ${triggername}`);
              await pool.query(`DROP TRIGGER IF EXISTS ${triggername};`);

              logger.debug(`[DB] Create trigger ${triggername}`);
              await pool.query(triggercode);
            });

        const User = require('../models/User');
        User.InsertAdminIfNotExists()
          .then(onready())
      });
    }
    else {
      logger.info("[DB] Database engine: %s", "Unknown");
      process.exit();
    }
  });

  return pool;
}
