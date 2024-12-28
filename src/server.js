const express = require('express')
const path = require('path')
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

app.listen(port, hostname, () => {
  console.log(`App is listening on ${hostname} on port ${port}...`)
})