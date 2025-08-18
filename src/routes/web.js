const express = require('express')
const {getHomePage, getLearnMorePage, postAddUser, getAbout} = require('../controllers/homeController')
const router = express.Router()
  
  router.get('/', getHomePage)
  
  router.get('/register', getLearnMorePage)

  router.post('/register', postAddUser)

  router.get('/about', getAbout)

  module.exports = router