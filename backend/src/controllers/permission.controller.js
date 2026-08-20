const {
  listPermissionByfile,
  canWrite,
  canDelete,
  existsPermission,
  createPermission,
  updatePermission,
} = require('../services/permission.service');
const { ROLES } = require('../utils/roles');

const getPermissionByUser = async (req, res) => {
  const file_id = req.params.file_id;
  const user_id = req.user_id;
  const level = req.accessLevel;
  const hasPermission = await hasWritePermission(user_id, file_id, level);
  if (!hasPermission) {
    return res.status(403).send({ error: 'No tienes permiso para editar a este archivo' });
  }
  const rows = await listPermissionByfile(file_id);
  res.status(200).send(rows);
};
const setPermissionByUser = async (req, res) => {
  const file_id = req.params.file_id;
  const user_permissions = req.user_id;
  const level = req.accessLevel;
  const { user_id, can_read, can_write, can_delete } = req.body;
  const hasPermission = await hasWritePermission(user_permissions, file_id, level);
  if (!hasPermission) {
    return res.status(403).send({ error: 'No tienes permiso para editar a este archivo' });
  }
  console.log(user_id, can_read, can_write, can_delete);
  const permission_id = await existsPermission(file_id, user_id);
  if (permission_id > 0) {
    const rows = await updatePermission(permission_id, can_read, can_write, can_delete);
    return res.status(200).send(rows);
  }
  const rows = await createPermission(user_id, null, file_id, can_read, can_write, can_delete);
  res.status(200).send(rows);
};
// ADMIN bypasea la ACL de archivos, igual que en file.controller.js.
const hasWritePermission = async (user_id, file_id, level) => {
  if (level === ROLES.ADMIN) {
    return true;
  }
  const permissions = await canWrite(user_id, file_id);
  return permissions.length > 0 && permissions[0].can_write === 1;
};

const hasDeletePermission = async (user_id, file_id) => {
  const permissions = await canDelete(user_id, file_id);
  return permissions.length > 0 && permissions[0].can_delete === 1;
};

module.exports = {
  getPermissionByUser,
  setPermissionByUser,
};
