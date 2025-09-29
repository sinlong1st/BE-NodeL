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

const deleteUserById = async (userId) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new Error(`User with id ${userId} does not exist.`);
    }
    const [result, fields] = await connection.query(`DELETE FROM Users WHERE id=?`, [userId]);
    return user;
};

module.exports = { getUserById, updateUserById, deleteUserById }