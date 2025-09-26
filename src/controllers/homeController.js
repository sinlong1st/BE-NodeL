const connection = require('../config/database')
const { getUserById, updateUserById, deleteUserById } = require('../services/CRUDService');

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
    // Get all users
    let [users] = await connection.query('SELECT * from Users');
    let totalBalance = 0;
    let accountHasBalance = 0;
    let accountNull;

    for (let i = 0; i < users.length; i++) {
        totalBalance += users[i].balance;
        if (users[i].balance != 0) {
            accountHasBalance += 1;
        }
    }
    accountNull = users.length - accountHasBalance;

    // Get active users (those with at least one weight entry)
    let [activeUsers] = await connection.query(`
        SELECT u.id, u.firstName, u.lastName, u.height_cm, COUNT(w.id) as weightCount
        FROM Users u
        JOIN UserWeights w ON u.id = w.user_id
        GROUP BY u.id
        ORDER BY weightCount DESC
    `);

    // Get latest weight for each user with height, and calculate BMI
    let [bmiUsers] = await connection.query(`
        SELECT u.id, u.firstName, u.lastName, u.height_cm,
               uw.weight_kg, uw.taken_at_utc
        FROM Users u
        JOIN (
            SELECT user_id, MAX(taken_at_utc) as max_time
            FROM UserWeights
            GROUP BY user_id
        ) latest ON u.id = latest.user_id
        JOIN UserWeights uw ON uw.user_id = latest.user_id AND uw.taken_at_utc = latest.max_time
        WHERE u.height_cm IS NOT NULL AND u.height_cm > 0
    `);

    // Calculate BMI, BMI category, and filter for 'good health' (BMI 18.5-24.9)
    let bmiRanking = bmiUsers.map(u => {
        const heightM = u.height_cm / 100;
        const bmi = u.weight_kg / (heightM * heightM);
        let category = '';
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi < 25) category = 'Normal';
        else if (bmi < 30) category = 'Overweight';
        else category = 'Obese';
        return {
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            bmi: parseFloat(bmi.toFixed(2)),
            weight: u.weight_kg,
            date: u.taken_at_utc,
            category
        };
    });
    // Sort by BMI closest to 22 (ideal BMI), then take top 5
    bmiRanking.sort((a, b) => Math.abs(a.bmi - 22) - Math.abs(b.bmi - 22));
    let goodHealthRanking = bmiRanking.slice(0, 5);

    res.render('stats.ejs', {
        pageTitle: 'About',
        headerTitle: 'Dashboard',
        author: "Admin",
        totalBalance: totalBalance,
        accountHasBalance: accountHasBalance,
        accountNull: accountNull,
        totalAccount: users.length,
        activeUsers: activeUsers,
        goodHealthRanking: goodHealthRanking
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
    const user = await getUserById(userId);
    const { success, error } = req.query;
    if (!user) {
        return res.status(404).render('userNotFound.ejs', {
            pageTitle: 'User Not Found',
            headerTitle: 'Dashboard',
            author: "Admin"
        });
    }
    res.render('editUser.ejs', {
        pageTitle: 'Edit User',
        headerTitle: 'Dashboard',
        author: "Admin",
        user: user,
        success,
        error
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
                // Latest BMI and category for this user (numeric)
                let latestBMI = null;
                let userBmiCategory = null;
                if (user && user.height_cm && weights.length > 0) {
                    // BMI method (Deurenberg formula, for adults)
                    // BF% = 1.20 * BMI + 0.23 * age - 10.8 * sex - 5.4
                    // We'll use sex=1 for male, 0 for female, age=30 as a placeholder
                    // (You can improve this if you have age/sex data)
                    const latestWeight = weights[weights.length-1].weight_kg;
                    const heightM = user.height_cm / 100;
                    const bmi = latestWeight / (heightM * heightM);
                    const age = user.age || 30; // fallback
                    const sex = user.gender === 'female' ? 0 : 1; // fallback to male
                    bodyFatEstimate = (1.20 * bmi + 0.23 * age - 10.8 * sex - 5.4).toFixed(1);
                    bodyFatMethod = 'BMI-based (Deurenberg formula, est. adult)';
                    // store numeric latest BMI and category
                    latestBMI = parseFloat(bmi.toFixed(2));
                    if (latestBMI < 18.5) userBmiCategory = 'Underweight';
                    else if (latestBMI < 25) userBmiCategory = 'Normal';
                    else if (latestBMI < 30) userBmiCategory = 'Overweight';
                    else userBmiCategory = 'Obese';
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
                                bodyFatMethod,
                                latestBMI,
                                userBmiCategory
                });
    } catch (err) {
        console.error('Error fetching weight trend:', err);
        res.status(500).send('Error fetching weight trend');
    }
}

const postUpdateUser = async (req, res) => {
    const userId = req.params.id;
    const { email, firstName, lastName, address, city, state, zipcode, balance, height_cm } = req.body;
    try {
        await updateUserById(userId, email, firstName, lastName, address, city, state, zipcode, balance, height_cm);
        console.log(`User ${userId} updated successfully.`);
        return res.redirect(`/users/${userId}/edit?success=1`);
    } catch (err) {
        console.error(`Failed to update user ${userId}:`, err);
        return res.redirect(`/users/${userId}/edit?error=1`);
    }
}

const deleteUser = async (req, res) => {
    const userId = req.params.id;
    let deletedUser;
    try {
        deletedUser = await deleteUserById(userId);
        console.log(deletedUser)
        console.log(`User ${deletedUser.firstName} ${deletedUser.lastName} (ID: ${userId}) deleted successfully.`);
        return res.redirect(`/?success=User+deleted+successfully`);
    } catch (err) {
        console.error(`Failed to delete user ${userId}:`, err);
        return res.redirect(`/?error=Failed+to+delete+user`);
    }
}

const { putUpdateUser } = require('./putUpdateUser');

// Quick CSV export for a user's weights
const exportWeightsCsv = async (req, res) => {
    const userId = req.params.id;
    try {
        const [userRows] = await connection.query('SELECT * FROM Users WHERE id = ?', [userId]);
        const user = userRows[0];
        if (!user) return res.status(404).send('User not found');

        const [weights] = await connection.query('SELECT * FROM UserWeights WHERE user_id = ? ORDER BY taken_at_utc ASC', [userId]);

        const filename = `weights-${ (user.firstName + user.lastName) || user.id}-${new Date().toISOString().slice(0,10)}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Optional BOM for Excel, helps Excel detect UTF-8 encoding correctly
        res.write('\uFEFF');

        // Header row
        res.write('user_id,firstName,lastName,height_cm,weight_kg,taken_at_utc\n');

        for (const w of weights) {
            const line = [
                user.id,
                '"' + (user.firstName || '').replace(/"/g, '""') + '"',
                '"' + (user.lastName || '').replace(/"/g, '""') + '"',
                user.height_cm || '',
                w.weight_kg,
                new Date(w.taken_at_utc).toISOString()
            ].join(',') + '\n';
            res.write(line);
        }

        res.end();
    } catch (err) {
        console.error('CSV export failed', err);
        res.status(500).send('Could not export CSV');
    }
}

// Placeholder for PDF export - heavier implementation later
const exportWeightsPdf = async (req, res) => {
    // For now respond with 501 Not Implemented – we'll add Puppeteer/pdf generation on demand
    res.status(501).send('PDF export not implemented yet.');
}

const getCompareUser = async (req, res) => {
    const userId = req.params.id;
    try {
        const [userRows] = await connection.query('SELECT * FROM Users WHERE id = ?', [userId]);
        const user = userRows[0];
        if (!user) return res.status(404).send('User not found');
    } catch (err) {
        console.error('Error fetching user for comparison:', err);
        res.status(500).send('Error fetching user for comparison');
    }
}

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
    putUpdateUser,
    postUpdateUser,
    exportWeightsCsv,
    exportWeightsPdf,
    getCompareUser,
    deleteUser
}