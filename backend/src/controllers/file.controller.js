const path = require('path');
const fs = require('fs');
const {
  createFile,
  fileVersion,
  createVersion,
  disableVersion,
  updateFileMetadata,
  updateFileData,
  getFile,
  getVersions,
  getFileActive,
  getFileVersion,
  searchFileByFolder,
  controlHistory,
  getHistoryByFile,
  deleteLogic,
  moveFile,
} = require('../services/file.service');
const { existFolder } = require('../services/folder.service');
const {
  canRead,
  canWrite,
  createPermission,
  canDelete,
} = require('../services/permission.service');
const { search } = require('../routes/folder.routes');
const { ROLES, isAtLeast } = require('../utils/roles');

// multer/busboy decodifica el nombre del archivo como latin1 aunque el navegador
// lo envía en UTF-8, corrompiendo tildes/ñ (ej: "Política" -> "PolÃ­tica").
const fixOriginalNameEncoding = (originalname) =>
  Buffer.from(originalname, 'latin1').toString('utf8');

// Controlador para subir archivos
const uploadFile = async (req, res) => {
  const { folder_id } = req.body;
  const user_id = req.user_id;
  const level = req.accessLevel;
  const file = req.file;
  console.log(file);
  try {
    if (!isAtLeast(level, ROLES.EDITOR)) {
      return res.status(403).send({ error: 'No tienes permiso para escribir en esta carpeta' });
    }
    if (!file) {
      return res.status(400).send('No se subió ningún archivo.');
    }
    const fileName = path.parse(fixOriginalNameEncoding(file.originalname));
    const existFile = await searchFileByFolder(fileName.name, fileName.ext, folder_id);
    if (existFile) {
      return res.status(203).send({ message: 'Documetno ya existe en el directorio.' });
    }
    // Insertar información en la base de datos
    const result = await createFile(folder_id, fileName.name, fileName.ext, user_id);
    const file_id = result.insertId; // Obtener el ID del archivo recién creado
    await createPermission(user_id, null, file_id, 1, 1, 1);
    const version = await fileVersion(file_id);
    const versionNumber = (version[0].max_version || 0) + 1;

    // Ruta de almacenamiento en el sistema de archivos
    const filePath = path.join('uploads', file.filename);

    // Insertar una nueva versión en 'file_versions'
    await createVersion(file_id, versionNumber, filePath, file.size, file.mimetype, fileName.name, fileName.ext);

    // Desactivar la versión anterior (si existía una)
    await disableVersion(file_id, versionNumber);

    // Actualizar metadatos del archivo
    await updateFileMetadata(user_id, file_id);

    // Actualiza el historial de cambios
    await controlHistory(user_id, file_id, 'CREACIÓN', versionNumber);

    res.status(201).send({ message: 'Archivo creado', file_id, versionNumber });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al crear el archivo' });
  }
};

// Controlador para actulizar archivos
const updateFile = async (req, res) => {
  const file_id = req.params.id_file;
  const { folder_id } = req.body;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    if (!isAtLeast(level, ROLES.EDITOR)) {
      return res.status(403).send({ error: 'No tienes permiso para escribir en esta carpeta' });
    }
    const hasPermission = await hasWritePermission(user_id, file_id, level);
    if (!hasPermission) {
      return res.status(403).send({ error: 'No tienes permiso para acceder a este archivo' });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).send('No se subió ningún archivo.');
    }
    const fileName = path.parse(fixOriginalNameEncoding(file.originalname));
    // Actualiza información en la base de datos (ya no toca extname — vive en file_versions)
    await updateFileData(user_id, folder_id, fileName.name, fileName.ext, file_id);
    const version = await fileVersion(file_id);
    const versionNumber = (version[0].max_version || 0) + 1;

    // Ruta de almacenamiento en el sistema de archivos
    const filePath = path.join('uploads', file.filename);

    // Insertar una nueva versión en 'file_versions' con su propio nombre y extensión
    await createVersion(file_id, versionNumber, filePath, file.size, file.mimetype, fileName.name, fileName.ext);

    // Desactivar la versión anterior (si existía una)
    await disableVersion(file_id, versionNumber);

    // Actualizar metadatos del archivo
    await updateFileMetadata(user_id, file_id);

    // Actualiza el historial de cambios
    await controlHistory(user_id, file_id, 'ACTUALIZACIÓN', versionNumber);

    res.status(201).send({ message: 'Archivo actualizado', file_id, versionNumber });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al crear el archivo' });
  }
};

// Controlador para obtener metadatos y versiones de un archivo
const getFileMetadataAndVersions = async (req, res) => {
  const { file_id } = req.params;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    // Verificar si el usuario tiene permiso de escritura
    const hasPermission = await hasReadPermission(user_id, file_id, level);
    if (!hasPermission) {
      return res.status(403).send({ error: 'No tienes permiso para acceder a este archivo' });
    }

    // Obtener metadatos del archivo
    const fileData = await getFile(file_id);

    // Obtener todas las versiones del archivo
    const versions = await getVersions(file_id);

    res.send({ fileData: fileData[0], versions });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al recuperar el archivo' });
  }
};

// Controlador para descargar un archivo
const downloadFile = async (req, res) => {
  const { file_id } = req.params;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    // Verificar si el usuario tiene permiso de lectura
    const hasPermission = await hasReadPermission(user_id, file_id, level);
    if (!hasPermission) {
      return res.status(403).send({ error: 'No tienes permiso para acceder a este archivo' });
    }

    const rows = await getFileActive(file_id);

    if (rows.length === 0) {
      return res
        .status(404)
        .send({ error: 'Archivo no encontrado o no existe una versión activa' });
    }
    const fileName = rows[0].name;
    const mimetype = rows[0].mime;
    const filePath = rows[0].content; // Ruta del archivo en el sistema de archivos

    // Verificar si el archivo existe en el sistema de archivos
    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ error: 'El archivo no se encuentra en el servidor' });
    }

    // Actualiza el historial de cambios
    const version = await fileVersion(file_id);
    await controlHistory(user_id, file_id, 'DESCARGA', version[0].max_version);

    // Enviar el archivo como una descarga
    res.setHeader('Content-Type', mimetype); // Tipo MIME
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition'); //Permite compartir los encabezados que el front lea el Content-Diposition
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        res.status(500).send({ error: 'Error al descargar el archivo' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al recuperar el archivo' });
  }
};

const downloadFileVersion = async (req, res) => {
  const { file_id, version } = req.params;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    // Verificar si el usuario tiene permiso de lectura
    const hasPermission = await hasReadPermission(user_id, file_id, level);
    if (!hasPermission) {
      return res.status(403).send({ error: 'No tienes permiso para acceder a este archivo' });
    }

    const rows = await getFileVersion(file_id, version);

    if (rows.length === 0) {
      return res
        .status(404)
        .send({ error: 'Archivo no encontrado o no existe una versión activa' });
    }
    const fileName = rows[0].name;
    const mimetype = rows[0].mime;
    const filePath = rows[0].content; // Ruta del archivo en el sistema de archivos

    // Verificar si el archivo existe en el sistema de archivos
    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ error: 'El archivo no se encuentra en el servidor' });
    }

    // Actualiza el histrorial de cambios
    await controlHistory(user_id, file_id, 'DESCARGA VERSIÓN', version);

    // Enviar el archivo como una descarga
    res.setHeader('Content-Type', mimetype); // Tipo MIME
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition'); //Permite compartir los encabezados que el front lea el Content-Diposition
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        res.status(500).send({ error: 'Error al descargar el archivo' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al recuperar el archivo' });
  }
};

// Controlador para visualizar un archivo
const viewFile = async (req, res) => {
  const { file_id } = req.params;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    // Verificar si el usuario tiene permiso de lectura
    const hasPermission = await hasReadPermission(user_id, file_id, level);
    if (!hasPermission) {
      return res.status(403).send({ error: 'No tienes permiso para acceder a este archivo' });
    }

    const rows = await getFileActive(file_id);

    if (rows.length === 0) {
      return res
        .status(404)
        .send({ error: 'Archivo no encontrado o no existe una versión activa' });
    }

    const filePath = rows[0].content; // Ruta del archivo en el sistema de archivos

    // Verificar si el archivo existe en el sistema de archivos
    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ error: 'El archivo no se encuentra en el servidor' });
    }

    // Actualiza el historial de cambios
    const version = await fileVersion(file_id);
    await controlHistory(user_id, file_id, 'DESCARGA', version[0].max_version);

    // Enviar el archivo como respuesta para ser visualizado en el navegador
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al recuperar el archivo' });
  }
};

const getHistoryFile = async (req, res) => {
  const { file_id } = req.params;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    // Verificar si el usuario tiene permiso de escritura
    const hasPermission = await hasReadPermission(user_id, file_id, level);
    if (!hasPermission) {
      return res.status(403).send({ error: 'No tienes permiso para acceder a este archivo' });
    }

    // Obtener historial del archivo
    const history = await getHistoryByFile(file_id);

    res.send(history);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al recuperar el archivo' });
  }
};
const deleteFile = async (req, res) => {
  const file_id = req.params.file_id;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    const hasPermission = await hasDeletePermission(user_id, file_id, level);
    if (!hasPermission) {
      return res.status(403).send({ error: 'No tienes permiso para borrar a este archivo' });
    }
    const rows = await deleteLogic(file_id, user_id);
    res.status(200).send(rows);
  } catch (error) {
    res.status(500).send({ error: 'Error al borrar el archivo' });
  }
};
// ADMIN bypasea la ACL de archivos: no depende de que el creador/otro usuario le comparta permiso.
const hasReadPermission = async (user_id, file_id, level) => {
  if (level === ROLES.ADMIN) {
    return true;
  }
  const permissions = await canRead(user_id, file_id);
  return permissions.length > 0 && permissions[0].can_read === 1;
};

const hasWritePermission = async (user_id, file_id, level) => {
  if (level === ROLES.ADMIN) {
    return true;
  }
  const permissions = await canWrite(user_id, file_id);
  return permissions.length > 0 && permissions[0].can_write === 1;
};

const hasDeletePermission = async (user_id, file_id, level) => {
  if (level === ROLES.ADMIN) {
    return true;
  }
  const permissions = await canDelete(user_id, file_id);
  return permissions.length > 0 && permissions[0].can_delete === 1;
};

const moveFileController = async (req, res) => {
  const { file_id } = req.params;
  const { target_folder_id } = req.body;
  const user_id = req.user_id;
  const level = req.accessLevel;
  try {
    if (!isAtLeast(level, ROLES.EDITOR)) {
      return res.status(403).send({ error: 'No tienes permiso para mover este archivo' });
    }
    const hasPermission = await hasWritePermission(user_id, file_id, level);
    if (!hasPermission) {
      return res.status(403).send({ error: 'No tienes permiso para acceder a este archivo' });
    }
    const targetFolder = await existFolder(target_folder_id);
    if (targetFolder.length === 0) {
      return res.status(400).send({ error: 'La carpeta destino no existe' });
    }

    await moveFile(file_id, target_folder_id, user_id);
    res.status(200).send({ message: 'Archivo movido con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al mover el archivo' });
  }
};

module.exports = {
  uploadFile,
  updateFile,
  getFileMetadataAndVersions,
  downloadFile,
  downloadFileVersion,
  viewFile,
  getHistoryFile,
  deleteFile,
  moveFileController,
};
