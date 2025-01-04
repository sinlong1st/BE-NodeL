const mysql = require('mysql2');
require('dotenv').config()


// Create the connection pool. The pool-specific settings are the defaults
const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PWD,  
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 100,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});


module.exports = connection