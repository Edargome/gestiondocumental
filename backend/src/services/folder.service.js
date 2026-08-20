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
          'SELECT folder_id, name, parent_folder_id FROM folders WHERE folder_id = ? AND isDelete=0',
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

// parent_folder_id se compara con <=> (NULL-safe) porque la raíz tiene parent_folder_id IS NULL.
async function existsFolderName(name, parent_folder_id, excludeFolderId = null) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          'SELECT folder_id FROM folders WHERE name = ? AND parent_folder_id <=> ? AND isDelete = 0 AND folder_id != ?',
          [name, parent_folder_id, excludeFolderId || 0],
          (error, rows) => {
            connection.release();
            if (error) {
              return reject(error);
            }
            resolve(rows.length > 0);
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

// target_folder_id unifica la navegación en el frontend: para una carpeta es ella misma,
// para un archivo es su carpeta contenedora. El CAST en el ancla de la CTE evita que MySQL
// trunque `path` al ancho de folders.name (VARCHAR(100)) en recursiones profundas.
async function searchByName(term) {
  try {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }
        connection.query(
          `WITH RECURSIVE folder_paths AS (
            SELECT folder_id, name, parent_folder_id, updated_at, CAST(name AS CHAR(2000)) COLLATE utf8mb4_0900_ai_ci AS path
            FROM folders WHERE parent_folder_id IS NULL AND isDelete = 0
            UNION ALL
            SELECT f.folder_id, f.name, f.parent_folder_id, f.updated_at, CONCAT(fp.path, ' / ', f.name)
            FROM folders f JOIN folder_paths fp ON f.parent_folder_id = fp.folder_id
            WHERE f.isDelete = 0
          )
          SELECT folder_id AS id, name, path, updated_at, 'folder' AS type, folder_id AS target_folder_id
          FROM folder_paths WHERE name LIKE CONCAT('%', ?, '%')
          UNION ALL
          SELECT fi.file_id AS id, fi.name, CONCAT(fp.path, ' / ', fi.name) AS path, fi.updated_at, 'file' AS type, fi.folder_id AS target_folder_id
          FROM files fi JOIN folder_paths fp ON fi.folder_id = fp.folder_id
          WHERE fi.isDelete = 0 AND fi.name LIKE CONCAT('%', ?, '%')
          ORDER BY type, name
          LIMIT 50`,
          [term, term],
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
  existsFolderName,
  listFolderByIdFolder,
  getPath,
  searchByName,
  deleteLogic,
  updateFolder,
  moveFolder,
  getDescendantIds,
};
