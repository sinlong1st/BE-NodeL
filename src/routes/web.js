const express = require('express')
const router = express.Router()


  
  router.get('/', (req, res) => {
    res.render('sample.ejs', {
      pageTitle: 'Welcome to My Financial App',
      headerTitle: 'Dashboard',
      cardTitle: 'Expenses',
      cardContent: 'Learn how to use the My Financial App to manage your finances. This app is designed to help you track your income and expenses, set financial goals, and create a budget that works for you. Get started today!',
      buttonText: 'Learn More',
      buttonLink: '/learn-more',
      author: 'Admin'
  });
  })
  
  router.get('/learn-more', (req, res) => {
    res.send(`<h1>Under construction!!!</h1>`)
  })
  
  router.get('/user', (req, res) => {
    res.send(`<h1>Engine user running</h1>`)
  })

  module.exports = router