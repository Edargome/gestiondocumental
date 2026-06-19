const bcrypt = require('bcrypt');
const { pool } = require('../connections/mysql');

async function auth(usernick, password) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT user_id, email, username, accessLevel, password_hash FROM users WHERE username = ? LIMIT 1',
          [usernick],
          async (error, rows) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            if (!rows[0]) {
              return resolve(null);
            }
            const match = await bcrypt.compare(password, rows[0].password_hash);
            if (!match) {
              return resolve(null);
            }
            const { password_hash, ...user } = rows[0];
            resolve(user);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

async function getUsers() {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT user_id, email, username FROM users',
          (error, rows) => {
            connection.release(); // Liberar la conexión de vuelta al pool
            if (error) {
              return reject(error);
            }
            resolve(rows);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}
async function getLevel(user_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT accessLevel FROM users WHERE user_id=?',
          [user_id],
          (error, rows) => {
            connection.release(); // Liberar la conexión de vuelta al pool
            if (error) {
              return reject(error);
            }
            resolve(rows[0]);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}
module.exports = {
  auth,
  getUsers,
  getLevel,
};
