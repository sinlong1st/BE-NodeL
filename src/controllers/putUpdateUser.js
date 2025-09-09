// Update user info (PUT)
const connection = require('../config/database')

const putUpdateUser = async (req, res) => {
    const userId = req.params.id;
    const { email, firstName, lastName, address, city, state, zipcode, balance, height_cm } = req.body;
    try {
        await connection.query(
            `UPDATE Users SET email=?, firstName=?, lastName=?, address=?, city=?, state=?, zipcode=?, balance=?, height_cm=? WHERE id=?`,
            [email, firstName, lastName, address, city, state, zipcode, balance, height_cm || null, userId]
        );
        res.redirect(`/users/${userId}/edit`);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Error updating user');
    }
};

module.exports = { putUpdateUser };
