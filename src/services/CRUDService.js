const connection = require('../config/database');
const getUserById = async (userId) => {
    const [result, fields] = await connection.query(`SELECT * from Users where id = ?`, [userId]);
    let user = result && result.length > 0 ? result[0] : null;
    return user;
}

module.exports = { getUserById };