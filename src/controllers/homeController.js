const connection = require('../config/database')

const getHomePage = async (req, res) => {
    users = []
    // connection.query('SELECT * from Users', function (error, results) {
    //     if (error) throw error
    //     users = results
    //     console.log('\nAccessed home page\n')
    //     res.render('home.ejs', {
    //         pageTitle: 'Welcome to My Financial App',
    //         headerTitle: 'Dashboard',
    //         cardTitle: 'Sign up your plan',
    //         cardContent: 'Register for free and get started today!',
    //         buttonText: 'Register',
    //         buttonLink: '/register',
    //         author: 'Admin',
    //         users: users // Pass the users array to the template
    //     });
    // })
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

const getStats = (req, res) => {
    res.render('stats.ejs', {
            pageTitle: 'About',
            headerTitle: 'Dashboard',
            author: "Admin"
        });
}

const postAddUser = async (req, res) => {
    console.log('Registering user...')
    let {email, password, hashedPassword, firstName, lastName, address, city, state, zipcode } = req.body
    sql = `INSERT INTO 
        Users (email, password, firstName, lastName, address, city, state, zipcode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    // connection.query(
    //     sql, 
    //     [email, hashedPassword, firstName, lastName, address, city, state, zipcode ], 
    //     function (error, results) {
    //         if (error) throw error
    //         console.log('User added to DB:', results)
    //         res.send(`
    //             <script>
    //             alert("User created successfully!");
    //             window.location.href = "/";
    //             </script>
    //         `);
    // });
    const [result, fields] = await connection.query(
        sql, 
        [email, hashedPassword, firstName, lastName, address, city, state, zipcode ]
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