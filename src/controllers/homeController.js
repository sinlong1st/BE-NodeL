const connection = require('../config/database')

const getHomePage = async (req, res) => {
    users = []
    const [result, fields] = await connection.query('SELECT * from Users')
    // console.log(fields)
    users = result
    console.log('\nNavigating to home page\n')
    res.render('home.ejs', {
        pageTitle: 'Welcome to My Financial App',
        headerTitle: 'Dashboard',
        cardTitle: 'Sign up your plan',
        cardContent: 'Register for free and get started today!',
        buttonText: 'Register',
        buttonLink: '/register',
        author: 'Admin',
        users: users // Pass the users array to the template
    });

}

const getLearnMorePage = (req, res) => {
    res.render('register.ejs')
}

const getStats = async (req, res) => {
    let [result, fields] = await connection.query('SELECT * from Users')
    let totalBalance = 0
    let accountHasBalance = 0
    let accountNull

    console.log(result)
    for (i=0; i < result.length; i++){
        totalBalance += result[i].balance;
        if (result[i].balance != 0) {
            accountHasBalance += 1
        }
    }
    accountNull = result.length - accountHasBalance
    res.render('stats.ejs', {
            pageTitle: 'About',
            headerTitle: 'Dashboard',
            author: "Admin",
            totalBalance: totalBalance,
            accountHasBalance: accountHasBalance,
            accountNull: accountNull,
            totalAccount: result.length
        });
}

const postAddUser = async (req, res) => {
    console.log('Registering user...')
    let {email, password, hashedPassword, firstName, lastName, address, city, state, zipcode, deposit } = req.body
    sql = `INSERT INTO 
        Users (email, password, firstName, lastName, address, city, state, zipcode, balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const [result, fields] = await connection.query(
        sql, 
        [email, hashedPassword, firstName, lastName, address, city, state, zipcode, deposit ]
    )
    console.log(result)
    res.send(`
                <script>
                alert("User created successfully!");
                window.location.href = "/";
                </script>
            `);

}

const getAbout = (req, res) => {
    res.render('about.ejs', {
            pageTitle: 'About',
            headerTitle: 'Dashboard',
            author: "Admin"
        });
}

module.exports = {
    getHomePage,
    getLearnMorePage,
    postAddUser,
    getAbout,
    getStats
}