const express = require('express')
const {getHomePage, getLearnMorePage, postAddUser, 
  getAbout, getStats, getEditUser, getUserWeights,
  postUserWeights, getWeightTrend, postUpdateUser, exportWeightsCsv, exportWeightsPdf, deleteUser} = require('../controllers/homeController')
const router = express.Router()
  
  router.get('/', getHomePage)
  
  router.get('/register', getLearnMorePage)

  router.post('/register', postAddUser)

  router.get('/about', getAbout)

  router.get('/stats', getStats)


  // Edit user form
  router.get('/users/:id/edit', getEditUser)

  // Remove/delete user
  router.post('/users/:id/delete', deleteUser)

  // Update user info (PUT)
  // router.put('/users/:id', require('../controllers/homeController').putUpdateUser)

  router.post('/users/:id/edit', postUpdateUser)

  router.get('/users/:id/weights', getUserWeights)

  router.post('/users/:id/weights', postUserWeights)

  router.get('/users/:id/weights/trend', getWeightTrend)
  router.get('/users/:id/weights/export.csv', exportWeightsCsv)
  router.get('/users/:id/weights/export.pdf', exportWeightsPdf)

  module.exports = router