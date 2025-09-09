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
    res.render('register.ejs', {
            pageTitle: 'About',
            headerTitle: 'Dashboard',
            author: "Admin",
        })
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
    let {email, password, hashedPassword, firstName, lastName, address, city, state, zipcode, deposit, height_cm } = req.body
    sql = `INSERT INTO 
        Users (email, password, firstName, lastName, address, city, state, zipcode, balance, height_cm)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const [result, fields] = await connection.query(
        sql, 
        [email, hashedPassword, firstName, lastName, address, city, state, zipcode, deposit, height_cm ]
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

const getEditUser = async (req, res) => {
    const userId = req.params.id; 
    let [result, fields] = await connection.query(`SELECT * from Users where id = ${userId}`)

    res.render('editUser.ejs', {
            pageTitle: 'Edit User',
            headerTitle: 'Dashboard',
            author: "Admin",
            user: result[0]
        });
}

const getUserWeights = async (req, res) => {
    const userId = req.params.id;
    try {
        // Query user info
        const [userResult] = await connection.query('SELECT * FROM Users WHERE id = ?', [userId]);
        const user = userResult[0];
        if (!user) {
            return res.status(404).send('User not found');
        }
        // Query all weights for the user (patient) by id
        const [weights] = await connection.query(
            'SELECT * FROM UserWeights WHERE user_id = ?',
            [userId]
        );
        res.render('userWeights.ejs', {
            pageTitle: 'User Weights',
            headerTitle: 'Dashboard',
            author: 'Admin',
            weights: weights,
            user: user
        });
    } catch (err) {
        console.error('Error fetching user weights:', err);
        res.status(500).send('Error fetching user weights');
    }
}

const postUserWeights = async (req, res) => {
    const userId = req.params.id;
    let { weight, taken_at } = req.body;
    // Ensure weight and taken_at are arrays
    if (!Array.isArray(weight)) weight = [weight];
    if (!Array.isArray(taken_at)) taken_at = [taken_at];
    try {
        const values = weight.map((w, i) => [userId, w, taken_at[i]]);
        // Insert all weights in one query if possible
        if (values.length > 0) {
            await connection.query(
                'INSERT INTO UserWeights (user_id, weight_kg, taken_at_utc) VALUES ' + values.map(() => '(?, ?, ?)').join(', '),
                values.flat()
            );
        }
        res.redirect(`/users/${userId}/weights`);
    } catch (err) {
        console.error('Error inserting user weights:', err);
        res.status(500).send('Error saving weights');
    }
}

const getWeightTrend = async (req, res) => {
    const userId = req.params.id;
    try {
        // Query user info
        const [userResult] = await connection.query('SELECT * FROM Users WHERE id = ?', [userId]);
        const user = userResult[0];
        if (!user) {
            return res.status(404).send('User not found');
        }
        // Query all weights for the user (patient) by id
        const [weights] = await connection.query(
            'SELECT * FROM UserWeights WHERE user_id = ? ORDER BY taken_at_utc ASC',
            [userId]
        );
        res.render('weightTrend.ejs', {
            pageTitle: 'Weight Trend',
            headerTitle: 'Dashboard',
            author: 'Admin',
            user: user,
            weights: weights
        });
    } catch (err) {
        console.error('Error fetching weight trend:', err);
        res.status(500).send('Error fetching weight trend');
    }
}

const { putUpdateUser } = require('./putUpdateUser');
module.exports = {
    getHomePage,
    getLearnMorePage,
    postAddUser,
    getAbout,
    getStats,
    getEditUser,
    getUserWeights,
    postUserWeights,
    getWeightTrend,
    putUpdateUser
}