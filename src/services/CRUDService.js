const connection = require('../config/database');
const getUserById = async (userId) => {
    const [result, fields] = await connection.query(`SELECT * from Users where id = ?`, [userId]);
    let user = result && result.length > 0 ? result[0] : null;
    return user;
}

const updateUserById = async (userId, email, firstName, lastName, address, city, state, zipcode, balance, height_cm) => {
    const [result, fields] = await connection.query(
        `UPDATE Users SET email=?, firstName=?, lastName=?, address=?, city=?, state=?, zipcode=?, balance=?, height_cm=? WHERE id=?`,
        [email, firstName, lastName, address, city, state, zipcode, balance, height_cm || null, userId]
    );
}

module.exports = { getUserById, updateUserById };