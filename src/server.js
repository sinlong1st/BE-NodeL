const express = require('express')
const path = require('path')
const mysql = require('mysql2');
const configViewEngine = require('./config/viewEngine')
const webRoutes = require('./routes/web')
require('dotenv').config()
const app = express()

// Const
const port = process.env.PORT || 3001
const hostname = process.env.HOST_NAME || 'localhost' // 127.0.0.1

// Info list
console.log(`Server running on computer: ${process.env.COMPUTERNAME} at ${hostname}`)

// Config view engine and static folder
configViewEngine(app)

// Define routes
// app.use('/v1', webRoutes) => can use it to version the API
app.use('/', webRoutes)

// Test DB connection
// Create the connection to database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, 
  user: process.env.DB_USER, 
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
});
console.log(connection)

// A simple SELECT query
connection.query(
  'SELECT * FROM `Users`',
  function (err, results, fields) {
    console.log(results); // results contains rows returned by server
  }
);


app.listen(port, hostname, () => {
  console.log(`App is listening on ${hostname} on port ${port}...`)
})