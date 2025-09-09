const express = require('express')
const {getHomePage, getLearnMorePage, postAddUser, 
  getAbout, getStats, getEditUser, getUserWeights,
  postUserWeights, getWeightTrend} = require('../controllers/homeController')
const router = express.Router()
  
  router.get('/', getHomePage)
  
  router.get('/register', getLearnMorePage)

  router.post('/register', postAddUser)

  router.get('/about', getAbout)

  router.get('/stats', getStats)


  // Edit user form
  router.get('/users/:id/edit', getEditUser)

  // Update user info (PUT)
  router.put('/users/:id', require('../controllers/homeController').putUpdateUser)

  router.get('/users/:id/weights', getUserWeights)

  router.post('/users/:id/weights', postUserWeights)

  router.get('/users/:id/weights/trend', getWeightTrend)

  module.exports = router