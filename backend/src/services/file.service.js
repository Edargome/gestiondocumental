const { pool } = require('../connections/mysql');

async function createFile(folder_id, name, extname, created_by) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'INSERT INTO files (folder_id, name, extname, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [folder_id, name, extname, created_by, created_by],
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
async function fileVersion(file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT MAX(version_number) AS max_version FROM file_versions WHERE file_id = ?',
          [file_id],
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
async function createVersion(file_id, versionNumber, filePath, size, mimetype, originalName, extname) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'INSERT INTO file_versions (file_id, version_number, content, size, mime, original_name, extname, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [file_id, versionNumber, filePath, size, mimetype, originalName, extname, true],
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
async function disableVersion(file_id, versionNumber) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE file_versions SET is_active = FALSE WHERE file_id = ? AND version_number < ?',
          [file_id, versionNumber],
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
async function updateFileMetadata(updated_by, file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE files SET updated_by = ?, updated_at = NOW() WHERE file_id = ?',
          [updated_by, file_id],
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
async function updateFileData(updated_by, folder_id, name, extname, file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE files SET updated_by = ?, folder_id = ?, updated_at = NOW() WHERE file_id = ?',
          [updated_by, folder_id, file_id],
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
async function getFile(file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT f.*, u.email, u.username, uu.email as email_updated, uu.username as username_updated FROM files as f LEFT JOIN users as u ON f.created_by = u.user_id LEFT JOIN users as uu ON f.updated_by = uu.user_id WHERE f.file_id = ? AND f.isDelete = 0',
          [file_id],
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
async function getVersions(file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT version_number, original_name, extname, content, is_active, created_at FROM file_versions WHERE file_id = ? ORDER BY version_number DESC',
          [file_id],
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
async function listFileByIdFolder(folder_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          `SELECT file_id as id, name, created_at, updated_at, 'task' as type FROM files WHERE folder_id = ? AND isDelete = 0`,
          [folder_id],
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

async function getFileActive(file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          `SELECT CONCAT(fv.original_name, fv.extname) as name, fv.mime, fv.content FROM files f JOIN file_versions fv ON f.file_id = fv.file_id WHERE fv.file_id = ? AND fv.is_active = TRUE AND f.isDelete = 0`,
          [file_id],
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

async function getFileVersion(file_id, version) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          `SELECT CONCAT(fv.original_name,'_',fv.version_number,fv.extname) as name, fv.mime, fv.content FROM files f JOIN file_versions fv ON f.file_id = fv.file_id WHERE fv.file_id = ? AND fv.version_number = ? AND f.isDelete = 0`,
          [file_id, version],
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

async function getFileIdentity(file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT name, extname FROM files WHERE file_id = ? AND isDelete = 0',
          [file_id],
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

async function searchFileByFolder(name, extname, folder_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          `SELECT file_id FROM files WHERE name = ? AND extname = ? AND folder_id = ? AND isDelete = 0`,
          [name, extname, folder_id],
          (error, rows) => {
            connection.release(); // Liberar la conexión de vuelta al pool
            if (error) {
              return reject(error);
            }
            console.log('total archivos', rows);
            resolve(rows.length > 0);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}
async function getHistoryByFile(file_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          `SELECT f.*, u.username FROM file_history as f left join users as u on f.user_id = u.user_id WHERE file_id=?`,
          [file_id],
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

async function controlHistory(user_id, file_id, action, version) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'INSERT INTO file_history (user_id, file_id, action, version_number, timestamp) VALUES (?, ?, ?, ?, NOW())',
          [user_id, file_id, action, version],
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

async function deleteLogic(file_id, updated_by) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE files SET updated_by = ?, isDelete = 1, updated_at = NOW() WHERE file_id = ?',
          [updated_by, file_id],
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

async function moveFile(file_id, new_folder_id, updated_by) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE files SET folder_id = ?, updated_by = ?, updated_at = NOW() WHERE file_id = ?',
          [new_folder_id, updated_by, file_id],
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

module.exports = {
  createFile,
  fileVersion,
  createVersion,
  disableVersion,
  updateFileMetadata,
  updateFileData,
  getFile,
  getFileIdentity,
  getVersions,
  listFileByIdFolder,
  getFileActive,
  getFileVersion,
  searchFileByFolder,
  controlHistory,
  getHistoryByFile,
  deleteLogic,
  moveFile,
};
