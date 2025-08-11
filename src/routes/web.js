const express = require('express')
const {getHomePage, getLearnMorePage, postAddUser} = require('../controllers/homeController')
const router = express.Router()
  
  router.get('/', getHomePage)
  
  router.get('/learn-more', getLearnMorePage)

  router.post('/register', postAddUser)

  module.exports = router