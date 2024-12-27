const express = require('express')
const app = express()
const path = require('path')
const port = 3000 //

// Config view engine ejs
app.set('view engine', 'ejs')
// Set views folder/directory
app.set('views', path.join(__dirname,'views'))

app.get('/', (req, res) => {
  res.send('Welcome administrator!')
})

app.get('/about', (req, res) => {
  res.render('sample.ejs', {
    pageTitle: 'Welcome to My Financial App',
    headerTitle: 'Dashboard',
    cardTitle: 'Dynamic Item',
    cardContent: 'Learn how to use the My Financial App to manage your finances. This app is designed to help you track your income and expenses, set financial goals, and create a budget that works for you. Get started today!',
    buttonText: 'Learn More',
    buttonLink: '/learn-more',
    author: 'Admin'
});
})

app.get('/user', (req, res) => {
  res.send(`<h1>Engine user running on port ${port}</h1>`)
})


app.listen(port, () => {
  console.log(`App is listening on port ${port}...`)
})