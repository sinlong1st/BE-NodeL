const mysql = require('mysql2');
require('dotenv').config()

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, 
  user: process.env.DB_USER, 
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
}); 
// => This is for single connection, not good for production or scaling up


module.exports = connection