const path = require('path')
const express = require('express')

const configViewEngine = (app) => {
  // Config view engine ejs
  app.set('view engine', 'ejs')
  // Set views folder/directory
  app.set('views', path.join(__dirname, '..', 'views'))
  // Config static files
  app.use(express.static(path.join(__dirname, '..', 'public')))
}

module.exports = configViewEngine