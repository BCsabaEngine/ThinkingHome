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

  pool.query('SHOW VARIABLES LIKE "version"', function (err, rows) {
    if (err) {
      logger.error(err);
      process.exit();
    }
    if (rows) {
      logger.info("[DB] Database engine started: %s", rows[0].Value);

      require('../models')();
      logger.debug("[DB] Models loaded");

      pool.query('SHOW TRIGGERS', function (err, rows) {
        for (const row of rows) {
          logger.debug(`[DB] Drop trigger ${row.Trigger}`);
          pool.query(`DROP TRIGGER IF EXISTS ${row.Trigger};`);
        }

        logger.debug(`[DB] Sync database model`);
        db.sync(async function (err) {
          if (err) {
            logger.error(err);
            process.exit();
          }

          for (const tableDefinition of db._tables.values())
            if (tableDefinition._schema.triggers)
              for (const triggername of Object.keys(tableDefinition._schema.triggers)) {

                const triggercode = tableDefinition._schema.triggers[triggername];

                logger.debug(`[DB] Create trigger ${triggername}`);
                pool.query(triggercode);
              };

          // const User = require('../models/User');
          // User.InsertAdminIfNotExists()
          //   .then(onready())
          onready();
        });
      });
    }
    else {
      logger.info("[DB] Database engine: %s", "Unknown");
      process.exit();
    }
  });

  return pool;
}
