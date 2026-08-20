const { pool } = require('../connections/mysql');

async function createFolder(name, parent_folder_id, created_by, description) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'INSERT INTO folders (name, description, parent_folder_id, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [name, description || null, parent_folder_id, created_by, created_by],
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
async function updateFolder(name, folder_id, updated_by, description) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE folders SET name=?, description=?, updated_by=?, updated_at = NOW() WHERE folder_id = ?',
          [name, description || null, updated_by, folder_id],
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

async function existFolder(parent_folder_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT folder_id FROM folders WHERE folder_id = ? AND isDelete=0',
          [parent_folder_id],
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

async function listFolderByIdFolder(folder_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        let query = '';
        let filter = [];
        if (folder_id == null) {
          query = `SELECT folder_id as id, name, description, created_at, updated_at, 'folder' as type FROM folders WHERE parent_folder_id is null AND isDelete=0`;
        } else {
          query = `SELECT folder_id as id, name, description, created_at, updated_at, 'folder' as type FROM folders WHERE parent_folder_id = ? AND isDelete=0`;
          filter = [folder_id];
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

async function getPath(folder_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'WITH RECURSIVE folder_hierarchy AS (SELECT folder_id,name,parent_folder_id FROM folders WHERE folder_id = ? UNION ALL SELECT f.folder_id, f.name, f.parent_folder_id FROM folders f INNER JOIN folder_hierarchy fh ON f.folder_id = fh.parent_folder_id) SELECT folder_id, name, parent_folder_id FROM folder_hierarchy ORDER BY parent_folder_id IS NULL DESC, folder_id ASC',
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

async function deleteLogic(folder_id, updated_by) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE folders SET updated_by = ?, isDelete = 1, updated_at = NOW() WHERE folder_id = ?',
          [updated_by, folder_id],
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

async function moveFolder(folder_id, new_parent_folder_id, updated_by) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'UPDATE folders SET parent_folder_id = ?, updated_by = ?, updated_at = NOW() WHERE folder_id = ?',
          [new_parent_folder_id, updated_by, folder_id],
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

// Retorna todos los IDs descendientes (incluido el propio folder_id) para validar ciclos.
async function getDescendantIds(folder_id) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          `WITH RECURSIVE descendants AS (
            SELECT folder_id FROM folders WHERE folder_id = ?
            UNION ALL
            SELECT f.folder_id FROM folders f
            INNER JOIN descendants d ON f.parent_folder_id = d.folder_id
            WHERE f.isDelete = 0
          )
          SELECT folder_id FROM descendants`,
          [folder_id],
          (error, rows) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(rows.map((row) => row.folder_id));
          }
        );
      });
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createFolder,
  existFolder,
  listFolderByIdFolder,
  getPath,
  deleteLogic,
  updateFolder,
  moveFolder,
  getDescendantIds,
};
