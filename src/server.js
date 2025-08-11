const express = require('express')
const configViewEngine = require('./config/viewEngine')
const connection = require('./config/database')
const webRoutes = require('./routes/web')
const e = require('express')
require('dotenv').config()
const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

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
// connection.query('SELECT * from Users', function (error, results) {
//   if (error) throw error
//   console.log('The solution is: ', results)
// })


app.listen(port, hostname, () => {
  console.log(`App is listening on ${hostname} on port ${port}...`)
})