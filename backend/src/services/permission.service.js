const { pool } = require('../connections/mysql');

async function canRead(user_id, file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT can_read FROM permissions WHERE user_id = ? AND file_id = ?',
          [user_id, file_id],
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
async function canWrite(user_id, file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT can_write FROM permissions WHERE user_id = ? AND file_id = ?',
          [user_id, file_id],
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
async function canDelete(user_id, file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT can_delete FROM permissions WHERE user_id = ? AND file_id = ?',
          [user_id, file_id],
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
async function canReadFolder(user_id, folder_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT can_read FROM permissions WHERE user_id = ? AND folder_id = ?',
          [user_id, folder_id],
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
async function canWriteFolder(user_id, folder_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT can_write FROM permissions WHERE user_id = ? AND folder_id = ?',
          [user_id, folder_id],
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
async function canDeleteFolder(user_id, folder_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT can_delete FROM permissions WHERE user_id = ? AND folder_id = ?',
          [user_id, folder_id],
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
async function createPermission(user_id, folder_id, file_id, can_read, can_write, can_delete) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        let query = 'INSERT INTO permissions (user_id, ';
        let filter = [user_id];
        if (folder_id != null) {
          query +=
            'folder_id, can_read, can_write, can_delete, created_at, updated_at) VALUES (?,?,?,?,?, NOW(), NOW())';
          filter = [...filter, folder_id, can_read, can_write, can_delete];
        }
        if (file_id != null) {
          query +=
            'file_id, can_read, can_write, can_delete, created_at, updated_at) VALUES (?,?,?,?,?, NOW(), NOW())';
          filter = [...filter, file_id, can_read, can_write, can_delete];
        }
        connection.query(query, filter, (error, rows) => {
          connection.release(); // Liberar la conexión de vuelta al pool
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
async function updatePermission(permission_id, can_read, can_write, can_delete) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE permissions SET can_read=?, can_write=?, can_delete=?, updated_at=NOW() WHERE permission_id=?',
          [can_read, can_write, can_delete, permission_id],
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

async function listPermissionByfile(file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT U.user_id, U.username, P.permission_id, P.can_read, P.can_write, P.can_delete FROM users as U left JOIN permissions as P ON U.user_id = P.user_id AND file_id = ?',
          [file_id],
          (error, rows) => {
            connection.release();
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

async function existsPermission(file_id, user_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT permission_id FROM permissions WHERE user_id = ? AND file_id = ?',
          [user_id, file_id],
          (error, rows) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(rows[0] == null ? 0 : rows[0].permission_id);
          }
        );
      });
    });
  } catch (error) {}
}
module.exports = {
  canRead,
  canWrite,
  canDelete,
  canReadFolder,
  canWriteFolder,
  canDeleteFolder,
  createPermission,
  updatePermission,
  listPermissionByfile,
  existsPermission,
};
