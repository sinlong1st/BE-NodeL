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
                // Query only the latest weight per day for the user
                const [weights] = await connection.query(
                        `SELECT uw.* FROM UserWeights uw
                         INNER JOIN (
                             SELECT DATE(taken_at_utc) as day, MAX(taken_at_utc) as max_time
                             FROM UserWeights
                             WHERE user_id = ?
                             GROUP BY day
                         ) latest
                         ON DATE(uw.taken_at_utc) = latest.day AND uw.taken_at_utc = latest.max_time
                         WHERE uw.user_id = ?
                         ORDER BY uw.taken_at_utc ASC`,
                        [userId, userId]
                );
                // Prepare chart labels and datetimes for EJS (date and date+time)
                const chartLabels = weights.map(w => {
                    const d = new Date(w.taken_at_utc);
                    return d.toLocaleDateString();
                });
                const chartDatetimes = weights.map(w => {
                    const d = new Date(w.taken_at_utc);
                    return d.toLocaleString();
                });

                // Body composition proxy: estimate body fat % (BMI-based, for adults)
                let bodyFatEstimate = null;
                let bodyFatMethod = null;
                if (user && user.height_cm && weights.length > 0) {
                    // BMI method (Deurenberg formula, for adults)
                    // BF% = 1.20 * BMI + 0.23 * age - 10.8 * sex - 5.4
                    // We'll use sex=1 for male, 0 for female, age=30 as a placeholder
                    // (You can improve this if you have age/sex data)
                    const latestWeight = weights[weights.length-1].weight_kg;
                    const heightM = user.height_cm / 100;
                    const bmi = latestWeight / (heightM * heightM);
                    const age = user.age || 30; // fallback
                    const sex = user.sex === 'female' ? 0 : 1; // fallback to male
                    bodyFatEstimate = (1.20 * bmi + 0.23 * age - 10.8 * sex - 5.4).toFixed(1);
                    bodyFatMethod = 'BMI-based (Deurenberg formula, est. adult)';
                }

                res.render('weightTrend.ejs', {
                                pageTitle: 'Weight Trend',
                                headerTitle: 'Dashboard',
                                author: 'Admin',
                                user: user,
                                weights: weights,
                                chartLabels,
                                chartDatetimes,
                                bodyFatEstimate,
                                bodyFatMethod
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