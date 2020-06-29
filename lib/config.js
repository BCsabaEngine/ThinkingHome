const dotenv = require('dotenv');

const configload = dotenv.config();
if (configload.error)
  throw configload.error;

module.exports = {
  database: {
    server: process.env.DATABASE_SERVER || "localhost",
    port: Number(process.env.DATABASE_PORT || "3306"),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    schema: process.env.DATABASE_SCHEMA || "ThinkingHome",
  },
  mqtt: {
    server: process.env.MQTT_SERVER || "localhost",
    port: process.env.MQTT_PORT || "1883",
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientid: process.env.MQTT_CLIENTID || "ThinkingHome",
    keepalive: Number(process.env.MQTT_KEEPALIVE || "30"),
  },
  http: {
    port: Number(process.env.HTTP_PORT || "80"),
  },
  log: {
    debug: process.env.LOG_DEBUG != 0,
  },
}