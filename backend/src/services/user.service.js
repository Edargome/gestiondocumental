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
          'SELECT user_id, email, username, accessLevel, must_change_password, password_hash FROM users WHERE username = ? AND isActive = 1 LIMIT 1',
          [usernick],
          async (error, rows) => {
            if (error) {
              connection.release();
              return reject(error);
            }
            if (!rows[0]) {
              connection.release();
              return resolve(null);
            }
            const match = await bcrypt.compare(password, rows[0].password_hash);
            if (!match) {
              connection.release();
              return resolve(null);
            }
            connection.query(
              'UPDATE users SET last_login = NOW() WHERE user_id = ?',
              [rows[0].user_id],
              (updateError) => {
                connection.release();
                if (updateError) {
                  return reject(updateError);
                }
                const { password_hash, ...user } = rows[0];
                resolve(user);
              }
            );
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
          'SELECT accessLevel, isActive FROM users WHERE user_id=?',
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
async function getUserById(user_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT user_id, email, username, accessLevel, isActive, last_login, created_at, updated_at FROM users WHERE user_id = ? LIMIT 1',
          [user_id],
          (error, rows) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(rows[0] || null);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

async function findUsers({ search, isActive, accessLevel, limit = 50, offset = 0 } = {}) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        const conditions = [];
        const params = [];
        if (search) {
          conditions.push('(username LIKE ? OR email LIKE ?)');
          params.push(`%${search}%`, `%${search}%`);
        }
        if (isActive !== undefined) {
          conditions.push('isActive = ?');
          params.push(isActive ? 1 : 0);
        }
        if (accessLevel !== undefined) {
          conditions.push('accessLevel = ?');
          params.push(accessLevel);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `SELECT user_id, email, username, accessLevel, isActive, last_login, created_at, updated_at FROM users ${where} ORDER BY username ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        connection.query(sql, params, (error, rows) => {
          connection.release();
          if (error) {
            return reject(error);
          }
          resolve(rows);
        });
      });
    });
  } catch (error) {
    throw error;
  }
}

async function createUser(username, email, password, accessLevel) {
  const password_hash = await bcrypt.hash(password, 10);
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'INSERT INTO users (username, email, password_hash, accessLevel, isActive, must_change_password) VALUES (?, ?, ?, ?, 1, 1)',
          [username, email, password_hash, accessLevel],
          (error, result) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(result.insertId);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

async function updateUser(user_id, { username, email }) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE users SET username = ?, email = ? WHERE user_id = ?',
          [username, email, user_id],
          (error, result) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(result.affectedRows);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

async function setUserStatus(user_id, isActive) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE users SET isActive = ? WHERE user_id = ?',
          [isActive ? 1 : 0, user_id],
          (error, result) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(result.affectedRows);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

async function setUserRole(user_id, accessLevel) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE users SET accessLevel = ? WHERE user_id = ?',
          [accessLevel, user_id],
          (error, result) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(result.affectedRows);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

async function setPassword(user_id, newPassword, mustChangePassword = false) {
  const password_hash = await bcrypt.hash(newPassword, 10);
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE users SET password_hash = ?, must_change_password = ? WHERE user_id = ?',
          [password_hash, mustChangePassword ? 1 : 0, user_id],
          (error, result) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(result.affectedRows);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

async function changeOwnPassword(user_id, currentPassword, newPassword) {
  try {
    const row = await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT password_hash FROM users WHERE user_id = ? LIMIT 1',
          [user_id],
          (error, rows) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(rows[0] || null);
          }
        );
      });
    });
    if (!row) {
      return false;
    }
    const match = await bcrypt.compare(currentPassword, row.password_hash);
    if (!match) {
      return false;
    }
    await setPassword(user_id, newPassword);
    return true;
  } catch (error) {
    throw error;
  }
}

async function countActiveAdmins() {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT COUNT(*) AS count FROM users WHERE accessLevel = 0 AND isActive = 1',
          (error, rows) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(rows[0].count);
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
  getLevel,
  getUserById,
  findUsers,
  createUser,
  updateUser,
  setUserStatus,
  setUserRole,
  setPassword,
  changeOwnPassword,
  countActiveAdmins,
};
