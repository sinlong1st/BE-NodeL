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

// PDF export: render a small HTML report (including a Chart.js chart) and use Puppeteer to generate a PDF
const exportWeightsPdf = async (req, res) => {
        const userId = req.params.id;
        try {
                const [userRows] = await connection.query('SELECT * FROM Users WHERE id = ?', [userId]);
                const user = userRows[0];
                if (!user) return res.status(404).send('User not found');

                const [weights] = await connection.query('SELECT * FROM UserWeights WHERE user_id = ? ORDER BY taken_at_utc ASC', [userId]);

                // Prepare chart data
                const labels = weights.map(w => new Date(w.taken_at_utc).toLocaleDateString());
                const data = weights.map(w => Number(w.weight_kg));

                // Compute analysis / goal / advice fields (mirror getWeightTrend logic)
                const startingWeight = weights.length > 0 ? Number(weights[0].weight_kg) : null;
                const latestWeight = weights.length > 0 ? Number(weights[weights.length-1].weight_kg) : null;
                const avgWeight = weights.length > 0 ? (weights.reduce((s,w)=> s + Number(w.weight_kg), 0) / weights.length) : null;

                let latestBMI = null;
                let userBmiCategory = null;
                let bodyFatEstimate = null;
                let bodyFatMethod = null;
                let minNormalWeight = null;
                let maxNormalWeight = null;
                let idealWeight = null;
                let needToLose = null;
                let needToGain = null;
                let progress = null;
                let progressToModel = null;
                let proteinMin = null;
                let proteinMax = null;

                if (user && user.height_cm && weights.length > 0) {
                    const heightM = user.height_cm / 100;
                    const bmi = latestWeight / (heightM * heightM);
                    latestBMI = parseFloat(bmi.toFixed(2));
                    if (latestBMI < 18.5) userBmiCategory = 'Underweight';
                    else if (latestBMI < 25) userBmiCategory = 'Normal';
                    else if (latestBMI < 30) userBmiCategory = 'Overweight';
                    else userBmiCategory = 'Obese';

                    // Body fat estimate (Deurenberg) using fallback age/sex
                    const age = user.age || 30;
                    const sex = user.gender === 'female' ? 0 : 1;
                    bodyFatEstimate = (1.20 * bmi + 0.23 * age - 10.8 * sex - 5.4).toFixed(1);
                    bodyFatMethod = 'BMI-based (Deurenberg formula, est. adult)';

                    minNormalWeight = 18.5 * heightM * heightM;
                    maxNormalWeight = 24.9 * heightM * heightM;
                    idealWeight = 22 * heightM * heightM;
                    needToLose = latestWeight - maxNormalWeight;
                    needToGain = minNormalWeight - latestWeight;

                    // progress toward target (as percent)
                    // choose targetWeight same as weightTrend logic
                    let targetWeight;
                    if (needToLose > 0) targetWeight = maxNormalWeight;
                    else if (needToGain > 0) targetWeight = minNormalWeight;
                    else targetWeight = idealWeight;

                    if (startingWeight === targetWeight) progress = 100;
                    else {
                        if (startingWeight > targetWeight) {
                            progress = ((startingWeight - latestWeight) / (startingWeight - targetWeight)) * 100;
                        } else {
                            progress = ((latestWeight - startingWeight) / (targetWeight - startingWeight)) * 100;
                        }
                    }
                    if (!isFinite(progress) || progress < 0) progress = 0;
                    if (progress > 100) progress = 100;

                    // progress to ideal
                    if (startingWeight === idealWeight) progressToModel = 100;
                    else {
                        if (startingWeight > idealWeight) {
                            progressToModel = ((startingWeight - latestWeight) / (startingWeight - idealWeight)) * 100;
                        } else {
                            progressToModel = ((latestWeight - startingWeight) / (idealWeight - startingWeight)) * 100;
                        }
                    }
                    if (!isFinite(progressToModel) || progressToModel < 0) progressToModel = 0;
                    if (progressToModel > 100) progressToModel = 100;

                    // protein recommendation
                    proteinMin = Math.round(latestWeight * 1.2);
                    proteinMax = Math.round(latestWeight * 1.8);
                }

                const filename = `weights-${ (user.firstName + user.lastName) || user.id }-${new Date().toISOString().slice(0,10)}.pdf`;

                // Try to render a server-side chart image (if chartjs-node-canvas is available)
                let chartImageData = null;
                try {
                    const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
                    const width = 800, height = 280;
                    const chartCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
                    const configuration = {
                        type: 'line',
                        data: { labels, datasets: [{ label: 'Weight (kg)', data, borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.08)', fill: true, tension: 0.2 }] },
                        options: { responsive: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } }
                    };
                    const imgBuf = await chartCanvas.renderToBuffer(configuration);
                    chartImageData = 'data:image/png;base64,' + imgBuf.toString('base64');
                } catch (e) {
                    // Not fatal — proceed without server-side image
                    console.warn('Server-side chart image generation not available:', e && e.message || e);
                }

                // Try to render the server EJS template first; fall back to inline HTML if it fails
                let html;
                try {
                    html = await new Promise((resolve, reject) => {
                        req.app.render('weightReport.ejs', {
                            user,
                            weights,
                            labels,
                            data,
                            chartImageData,
                            avgWeight,
                            latestBMI,
                            userBmiCategory,
                            bodyFatEstimate,
                            bodyFatMethod,
                            minNormalWeight,
                            maxNormalWeight,
                            idealWeight,
                            needToLose,
                            needToGain,
                            progress,
                            progressToModel,
                            proteinMin,
                            proteinMax,
                            generatedAt: new Date().toLocaleString()
                        }, (err, rendered) => err ? reject(err) : resolve(rendered));
                    });
                } catch (e) {
                    console.warn('Failed to render weightReport.ejs, falling back to inline HTML', e && e.stack || e);
                    // Build a minimal inline HTML page that draws the chart client-side
                    html = `<!doctype html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width,initial-scale=1">
                    <title>Weight report for ${escapeHtml(user.firstName || '')} ${escapeHtml(user.lastName || '')}</title>
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                    <style>
                        body { font-family: Arial, Helvetica, sans-serif; padding:20px; color:#0f172a }
                        .header { display:flex; justify-content:space-between; align-items:center }
                        .meta { color:#475569 }
                        .chart-wrap { width:100%; max-width:800px; margin-top:18px }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h2>Weight report</h2>
                            <div class="meta">User: ${escapeHtml(user.firstName || '')} ${escapeHtml(user.lastName || '')} (id: ${user.id})</div>
                        </div>
                        <div>${new Date().toLocaleString()}</div>
                    </div>
                    <div style="margin-top:12px;">
                        <strong>Height:</strong> ${user.height_cm ? escapeHtml(String(user.height_cm)) + ' cm' : 'N/A'}
                    </div>
                    <div class="chart-wrap">
                        <canvas id="weightChart" width="800" height="280"></canvas>
                    </div>
                    <div style="margin-top:12px; color:#374151;">Data points: ${weights.length}</div>

                    <script>
                        window.__pdfReady = false;
                        const labels = ${JSON.stringify(labels)};
                        const data = ${JSON.stringify(data)};
                        // Draw chart
                        (function(){
                            const ctx = document.getElementById('weightChart').getContext('2d');
                            new Chart(ctx, {
                                type: 'line',
                                data: { labels: labels, datasets: [{ label: 'Weight (kg)', data: data, borderColor:'#0ea5e9', backgroundColor:'rgba(14,165,233,0.08)', fill:true, tension:0.2 }] },
                                options: { responsive:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:false } } }
                            });
                            // Small delay to ensure canvas paints
                            setTimeout(function(){ window.__pdfReady = true; }, 250);
                        })();
                    </script>
                </body>
                </html>`;
                }

                // If debug flag supplied, return the rendered HTML for inspection instead of generating PDF
                if (req.query && (req.query.debug === '1' || req.query.debug === 'true')) {
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    return res.send(html);
                }

                // Try to require puppeteer dynamically so the app doesn't crash if not installed
                let puppeteer;
                try {
                        console.log('Attempting to require puppeteer...');
                        puppeteer = require('puppeteer');
                        console.log('puppeteer required OK');
                } catch (err) {
                        console.error('Puppeteer require failed:', err && err.stack || err);
                        return res.status(501).send('PDF export requires puppeteer. Run `npm install puppeteer` and try again.');
                }

                // Prepare launch options; allow overriding with CHROME_PATH
                const launchOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
                if (process.env.CHROME_PATH) {
                    launchOptions.executablePath = process.env.CHROME_PATH;
                    console.log('Using CHROME_PATH for puppeteer:', process.env.CHROME_PATH);
                }

                let browser, page;
                try {
                    console.log('Launching browser with options:', launchOptions);
                    browser = await puppeteer.launch(launchOptions);
                    page = await browser.newPage();
                    // set a larger viewport to match our template widths and improve rendering
                    try { await page.setViewport({ width: 1200, height: 1600 }); } catch(e){}
                } catch (err) {
                    console.error('Failed to launch puppeteer browser:', err && err.stack || err);
                    return res.status(500).send('Failed to launch headless browser for PDF generation. Check server logs.');
                }

                try {
                    // Set content and wait for networkidle; then wait for our JS to mark readiness
                    // Emulate screen styles and set content
                    try { await page.emulateMediaType('screen'); } catch(e){}
                    await page.setContent(html, { waitUntil: 'networkidle0' });
                    // Wait for the chart or our ready flag before printing
                    try {
                        await page.waitForFunction('window.__pdfReady === true', { timeout: 12000 });
                    } catch (e) {
                        console.warn('Timed out waiting for chart render, continuing to PDF generation');
                    }

                    let pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' } });
                    await browser.close();
                    // Ensure we have a Node Buffer (puppeteer may return Uint8Array-like)
                    if (!Buffer.isBuffer(pdfBuffer)) {
                        try {
                            pdfBuffer = Buffer.from(pdfBuffer);
                        } catch (e) {
                            console.error('Failed to coerce PDF result to Buffer:', e && e.stack || e);
                            return res.status(500).send('PDF generation produced invalid data');
                        }
                    }
                    console.log('Generated PDF buffer, length=', pdfBuffer.length, 'type=', Object.prototype.toString.call(pdfBuffer));
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    res.setHeader('Content-Length', String(pdfBuffer.length));
                    return res.end(pdfBuffer);
                } catch (err) {
                    console.error('Error during page rendering / PDF generation:', err && err.stack || err);
                    try { if (browser) await browser.close(); } catch(e){}
                    return res.status(500).send('PDF generation failed — check server logs for details.');
                }

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                return res.send(pdfBuffer);
        } catch (err) {
                console.error('PDF export failed', err);
                return res.status(500).send('Could not generate PDF');
        }
}

// small helper to escape HTML in template strings
function escapeHtml(str) {
        return String(str || '').replace(/[&<>\"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
}

const getCompareUser = async (req, res) => {
    const userId = req.params.id;
    user = null;
    try {
        const [userRows] = await connection.query('SELECT * FROM Users WHERE id = ?', [userId]);
        const user = userRows[0];
        if (!user) return res.status(404).send('User not found');
    } catch (err) {
        console.error('Error fetching user for comparison:', err);
        res.status(500).send('Error fetching user for comparison');
    }
    res.send("Implementing...")
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