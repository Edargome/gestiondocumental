const { pool } = require('../connections/mysql');

async function getDeletedFiles() {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) return reject(err);
        connection.query(
          `SELECT f.file_id, f.name, f.extname, f.folder_id, f.updated_at,
                  fo.name AS folder_name, fo.isDelete AS folder_isDelete,
                  u.username AS deleted_by
           FROM files f
           LEFT JOIN folders fo ON f.folder_id = fo.folder_id
           LEFT JOIN users u ON f.updated_by = u.user_id
           WHERE f.isDelete = 1
           ORDER BY f.updated_at DESC`,
          [],
          (error, rows) => {
            connection.release();
            if (error) return reject(error);
            resolve(rows);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

async function getDeletedFolders() {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) return reject(err);
        connection.query(
          `SELECT fo.folder_id, fo.name, fo.parent_folder_id, fo.updated_at,
                  pf.name AS parent_folder_name, pf.isDelete AS parent_folder_isDelete,
                  u.username AS deleted_by
           FROM folders fo
           LEFT JOIN folders pf ON fo.parent_folder_id = pf.folder_id
           LEFT JOIN users u ON fo.updated_by = u.user_id
           WHERE fo.isDelete = 1
           ORDER BY fo.updated_at DESC`,
          [],
          (error, rows) => {
            connection.release();
            if (error) return reject(error);
            resolve(rows);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

async function restoreFile(file_id, updated_by) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) return reject(err);
        connection.query(
          'UPDATE files SET isDelete = 0, updated_by = ?, updated_at = NOW() WHERE file_id = ?',
          [updated_by, file_id],
          (error, rows) => {
            connection.release();
            if (error) return reject(error);
            resolve(rows);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

async function restoreFolder(folder_id, updated_by) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) return reject(err);
        connection.query(
          'UPDATE folders SET isDelete = 0, updated_by = ?, updated_at = NOW() WHERE folder_id = ?',
          [updated_by, folder_id],
          (error, rows) => {
            connection.release();
            if (error) return reject(error);
            resolve(rows);
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

module.exports = { getDeletedFiles, getDeletedFolders, restoreFile, restoreFolder };
