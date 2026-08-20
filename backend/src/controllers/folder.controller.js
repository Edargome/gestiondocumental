const {
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
} = require('../services/folder.service');
const { listFileByIdFolder } = require('../services/file.service');
const {
  canReadFolder,
  canWriteFolder,
  createPermission,
} = require('../services/permission.service');
const { ROLES, isAtLeast } = require('../utils/roles');

const create = async (req, res) => {
  const { name, parent_folder_id, desc } = req.body;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    if (parent_folder_id != null) {
      const parentFolder = await existFolder(parent_folder_id);
      if (parentFolder.length === 0) {
        return res.status(400).send({ error: 'La carpeta padre no existe' });
      }
    }
    // Verificar si el usuario tiene permiso de escritura
    // const hasPermission = await hasWritePermissionFolder(user_id, parent_folder_id);
    // if (!hasPermission) {
    //   return res.status(403).send({ error: 'No tienes permiso para escribir en esta carpeta' });
    // }
    if (!isAtLeast(level, ROLES.EDITOR)) {
      return res.status(403).send({ error: 'No tienes permiso para escribir en esta carpeta' });
    }
    if (await existsFolderName(name, parent_folder_id)) {
      return res.status(409).send({ error: 'Ya existe una carpeta con ese nombre en este directorio' });
    }
    const result = await createFolder(name, parent_folder_id, user_id, desc);
    const folder_id = result.insertId;
    await createPermission(user_id, folder_id, null, 1, 1, 1);
    res.status(200).send({ message: 'Carpeta creada con éxito', folder_id });
  } catch (error) {
    res.status(500).send({ error: 'Error al crear la carpeta', error });
  }
};
const update_folder = async (req, res) => {
  const { folder_id } = req.params;
  const { name, desc } = req.body;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    let currentFolder = null;
    if (folder_id != null) {
      const rows = await existFolder(folder_id);
      if (rows.length === 0) {
        return res.status(400).send({ error: 'La carpeta padre no existe' });
      }
      currentFolder = rows[0];
    }
    // Verificar si el usuario tiene permiso de escritura
    // const hasPermission = await hasWritePermissionFolder(user_id, parent_folder_id);
    // if (!hasPermission) {
    //   return res.status(403).send({ error: 'No tienes permiso para escribir en esta carpeta' });
    // }
    if (!isAtLeast(level, ROLES.EDITOR)) {
      return res.status(403).send({ error: 'No tienes permiso para escribir en esta carpeta' });
    }
    if (await existsFolderName(name, currentFolder.parent_folder_id, folder_id)) {
      return res.status(409).send({ error: 'Ya existe una carpeta con ese nombre en este directorio' });
    }
    await updateFolder(name, folder_id, user_id, desc);
    res.status(200).send({ message: 'Carpeta actualizada con éxito', folder_id });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: 'Error al actualizar la carpeta', error });
  }
};
const deleteFolder = async (req, res) => {
  const { folder_id } = req.params;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    if (folder_id != null) {
      const parentFolder = await existFolder(folder_id);
      if (parentFolder.length === 0) {
        return res.status(400).send({ error: 'La carpeta padre no existe' });
      }
    }
    if (!isAtLeast(level, ROLES.EDITOR)) {
      return res.status(403).send({ error: 'No tienes permiso para escribir en esta carpeta' });
    }
    const folders = await listFolderByIdFolder(folder_id);
    const files = await listFileByIdFolder(folder_id);
    if (folders.length > 0 || files.length > 0) {
      return res.status(203).send({ error: 'La carpeta no esta vacia' });
    } else {
      await deleteLogic(folder_id, user_id);
      return res.status(200).send({ message: 'La carpeta fue borrada con éxito', folder_id });
    }
  } catch (error) {
    res.status(500).send({ error: 'Error al borrar la carpeta', error });
  }
};

const listFolderContents = async (req, res) => {
  const { folder_id } = req.params; // ID de la carpeta a listar
  const user_id = req.user_id;
  try {
    // Verificar si el usuario tiene permiso de lectura
    // const hasPermission = await hasReadPermissionFolder(user_id, folder_id);
    // if (!hasPermission) {
    //   return res.status(403).send({ error: 'No tienes permiso para escribir en esta carpeta' });
    // }
    // Listar subcarpetas dentro de la carpeta especificada
    const folders = await listFolderByIdFolder(folder_id);

    // Listar archivos dentro de la carpeta especificada
    const files = await listFileByIdFolder(folder_id);

    res.send({ folders, files });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al listar el contenido de la carpeta' });
  }
};

// Método recursivo para obtener el árbol de directorios
const getFolderTree = async (folderId) => {
  // Obtener información de la carpeta actual
  const folders = await listFolderByIdFolder(folderId);

  const folderTree = [];

  for (let folder of folders) {
    // Recursivamente obtener subcarpetas y construir la estructura de árbol
    const subTree = await getFolderTree(folder.id);
    folderTree.push({
      id: folder.id,
      name: folder.name,
      children: subTree,
    });
  }

  return folderTree;
};

// Controlador para obtener el árbol de directorios
const getFolderTreeController = async (req, res) => {
  const { folder_id } = req.params; // ID de la carpeta raíz
  const rootFolderId = folder_id && folder_id !== '0' ? folder_id : null;
  try {
    const folderTree = await getFolderTree(rootFolderId);
    res.send({ folderTree });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al obtener el árbol de directorios' });
  }
};
const getFolderPath = async (req, res) => {
  const { folder_id } = req.params;
  try {
    const folderPath = await getPath(folder_id);
    res.send({ folderPath: folderPath });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al obtener la ruta del directorio' });
  }
};

const searchController = async (req, res) => {
  const term = (req.query.q || '').trim();
  if (!term) {
    return res.status(400).send({ error: 'El término de búsqueda es requerido' });
  }
  try {
    const results = await searchByName(term);
    res.status(200).send({ results });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al buscar' });
  }
};

const hasReadPermissionFolder = async (user_id, folder_id) => {
  const permissions = await canReadFolder(user_id, folder_id);
  return permissions.length > 0 && permissions[0].can_read === 1;
};
const hasWritePermissionFolder = async (user_id, folder_id) => {
  if (folder_id == null && user_id == 1) {
    return true;
  }
  const permissions = await canWriteFolder(user_id, folder_id);
  return permissions.length > 0 && permissions[0].can_write === 1;
};

const moveFolderController = async (req, res) => {
  const { folder_id } = req.params;
  const { target_folder_id } = req.body;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    if (!isAtLeast(level, ROLES.EDITOR)) {
      return res.status(403).send({ error: 'No tienes permiso para mover esta carpeta' });
    }

    if (parseInt(folder_id) === parseInt(target_folder_id)) {
      return res.status(400).send({ error: 'No puedes mover una carpeta a sí misma' });
    }

    const folderRows = await existFolder(folder_id);
    if (folderRows.length === 0) {
      return res.status(400).send({ error: 'La carpeta no existe' });
    }

    const targetFolder = await existFolder(target_folder_id);
    if (targetFolder.length === 0) {
      return res.status(400).send({ error: 'La carpeta destino no existe' });
    }

    // Verificar que el destino no sea un descendiente de la carpeta que se mueve (evita ciclos).
    const descendantIds = await getDescendantIds(folder_id);
    if (descendantIds.includes(parseInt(target_folder_id))) {
      return res.status(400).send({ error: 'No puedes mover una carpeta a una de sus subcarpetas' });
    }

    if (await existsFolderName(folderRows[0].name, target_folder_id, folder_id)) {
      return res.status(409).send({ error: 'Ya existe una carpeta con ese nombre en el destino' });
    }

    await moveFolder(folder_id, target_folder_id, user_id);
    res.status(200).send({ message: 'Carpeta movida con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al mover la carpeta' });
  }
};

module.exports = {
  create,
  listFolderContents,
  getFolderTreeController,
  getFolderPath,
  searchController,
  deleteFolder,
  update_folder,
  moveFolderController,
};
