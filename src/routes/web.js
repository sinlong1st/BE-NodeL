const express = require('express')
const {getHomePage, getLearnMorePage} = require('../controllers/homeController')
const router = express.Router()
  
  router.get('/', getHomePage)
  
  router.get('/learn-more', getLearnMorePage)

  module.exports = router