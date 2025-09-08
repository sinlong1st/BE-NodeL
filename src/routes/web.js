const express = require('express')
const {getHomePage, getLearnMorePage, postAddUser, 
  getAbout, getStats, getEditUser, getUserWeights,
  postUserWeights} = require('../controllers/homeController')
const router = express.Router()
  
  router.get('/', getHomePage)
  
  router.get('/register', getLearnMorePage)

  router.post('/register', postAddUser)

  router.get('/about', getAbout)

  router.get('/stats', getStats)

  router.get('/users/:id/edit', getEditUser)

  router.get('/users/:id/weights', getUserWeights)

  router.post('/users/:id/weights', postUserWeights)

  module.exports = router