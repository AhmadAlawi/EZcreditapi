//db connection

const pg = require("pg");
const client = new pg.Client({
  connectionString: process.env.DBSTRING,
  //to disbale if not ssl
  // ssl: {
  //   rejectUnauthorized: false,
  // },
});

client.connect();

module.exports = client;
