const connection = require('../config/database')

const getHomePage = (req, res) => {
    users = []
    connection.query('SELECT * from Users', function (error, results) {
        if (error) throw error
        users = results
        console.log('\nAccessed home page\n')
        res.render('home.ejs', {
            pageTitle: 'Welcome to My Financial App',
            headerTitle: 'Dashboard',
            cardTitle: 'Sign up your plan',
            cardContent: 'Register for free and get started today!',
            buttonText: 'Register',
            buttonLink: '/learn-more',
            author: 'Admin',
            users: users // Pass the users array to the template
        });
    })
}

const getLearnMorePage = (req, res) => {
    res.render('register.ejs')
}

const postAddUser = (req, res) => {
    console.log('Registering user...')
    // connection.query('INSERT INTO Users SET ?', { username, email, password }, function (error, results) {
    //     if (error) throw error
    //     console.log('User added to DB:', results)
    //     res.redirect('/')
    // })
    console.log('User added to DB:', req.body)
    res.send(req.body)
}
module.exports = {
    getHomePage,
    getLearnMorePage,
    postAddUser
}