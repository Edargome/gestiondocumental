const {
  getDeletedFiles,
  getDeletedFolders,
  restoreFile,
  restoreFolder,
} = require('../services/trash.service');

const getTrash = async (req, res) => {
  const level = req.accessLevel;
  if (level > 2) {
    return res.status(403).send({ error: 'No tienes permiso para acceder a la papelera' });
  }
  try {
    const files = await getDeletedFiles();
    const folders = await getDeletedFolders();
    res.status(200).send({ files, folders });
  } catch (error) {
    res.status(500).send({ error: 'Error al obtener la papelera' });
  }
};

const restoreFileController = async (req, res) => {
  const level = req.accessLevel;
  const user_id = req.user_id;
  if (level > 2) {
    return res.status(403).send({ error: 'No tienes permiso para restaurar archivos' });
  }
  const { file_id } = req.params;
  try {
    await restoreFile(file_id, user_id);
    res.status(200).send({ message: 'Archivo restaurado con éxito' });
  } catch (error) {
    res.status(500).send({ error: 'Error al restaurar el archivo' });
  }
};

const restoreFolderController = async (req, res) => {
  const level = req.accessLevel;
  const user_id = req.user_id;
  if (level > 2) {
    return res.status(403).send({ error: 'No tienes permiso para restaurar carpetas' });
  }
  const { folder_id } = req.params;
  try {
    await restoreFolder(folder_id, user_id);
    res.status(200).send({ message: 'Carpeta restaurada con éxito' });
  } catch (error) {
    res.status(500).send({ error: 'Error al restaurar la carpeta' });
  }
};

module.exports = { getTrash, restoreFileController, restoreFolderController };
