const express = require('express')
const app = express()
const path = require('path')
require('dotenv').config()

// Const
const port = process.env.PORT || 3001
const hostname = process.env.HOST_NAME || 'localhost' // 127.0.0.1

// Info list
console.log(`Server running on computer: ${process.env.COMPUTERNAME} at ${hostname}`)
// Config view engine ejs
app.set('view engine', 'ejs')
// Set views folder/directory
app.set('views', path.join(__dirname,'views'))

// Config static files
app.use(express.static(path.join(__dirname,'public')))

app.get('/', (req, res) => {
  res.send('Welcome administrator!')
})

app.get('/home', (req, res) => {
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

app.get('/learn-more', (req, res) => {

})

app.get('/user', (req, res) => {
  res.send(`<h1>Engine user running on port ${port}</h1>`)
})


app.listen(port, hostname, () => {
  console.log(`App is listening on ${hostname} on port ${port}...`)
})