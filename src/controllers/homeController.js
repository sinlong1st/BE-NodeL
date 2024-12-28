const getHomePage = (req, res) => {
    res.render('sample.ejs', {
        pageTitle: 'Welcome to My Financial App',
        headerTitle: 'Dashboard',
        cardTitle: 'Expenses',
        cardContent: 'Learn how to use the My Financial App to manage your finances. This app is designed to help you track your income and expenses, set financial goals, and create a budget that works for you. Get started today!',
        buttonText: 'Learn More',
        buttonLink: '/learn-more',
        author: 'Admin'
    });
}

const getLearnMorePage = (req, res) => {
    res.render('underConstruction.ejs')
}
module.exports = {
    getHomePage,
    getLearnMorePage
}