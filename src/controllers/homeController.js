const connection = require('../config/database')

const getHomePage = (req, res) => {
    users = []
    connection.query('SELECT * from Users', function (error, results) {
        if (error) throw error
        users = results
        console.log('Accessed home page, data:', results[0], "...")
        res.render('home.ejs', {
            pageTitle: 'Welcome to My Financial App',
            headerTitle: 'Dashboard',
            cardTitle: 'Register',
            cardContent: 'Register today for free! Get started today!',
            buttonText: 'Learn More',
            buttonLink: '/learn-more',
            author: 'Admin',
            users: users // Pass the users array to the template
        });
    })
}

const getLearnMorePage = (req, res) => {
    res.render('underConstruction.ejs')
}
module.exports = {
    getHomePage,
    getLearnMorePage
}