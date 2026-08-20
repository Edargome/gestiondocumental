const {
  auth,
  getUserById,
  findUsers,
  createUser,
  updateUser,
  setUserStatus,
  setUserRole,
  setPassword,
  changeOwnPassword,
  countActiveAdmins,
} = require('./../services/user.service');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../utils/roles');
const { isNonEmptyString, isEmail, minLength, isInt } = require('../utils/validate');
const { registerFailedAttempt, clearAttempts } = require('../middlewares/loginRateLimit');

const login = async (req, res) => {
  try {
    const { nickname, password } = req.body;
    const response = await auth(nickname, password);
    if (response) {
      clearAttempts(req);
      const token = jwt.sign({ ...response }, process.env.SECRET, { expiresIn: '8h' });
      res.json({ estado: 200, error: null, data: { token } });
    } else {
      registerFailedAttempt(req);
      res.json({ estado: 204, error: 'error de usuario y/o contraseña', data: null });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await getUserById(req.user_id);
    if (!user) {
      return res.status(404).send({ error: 'Usuario no encontrado' });
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const isValidAccessLevel = (level) =>
  level !== null && level >= ROLES.ADMIN && level <= ROLES.LECTOR;

const list = async (req, res) => {
  try {
    const { search, isActive, accessLevel, page, pageSize } = req.query;
    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const filters = { search, limit, offset: (currentPage - 1) * limit };
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true' || isActive === '1';
    }
    if (accessLevel !== undefined && isInt(accessLevel)) {
      filters.accessLevel = parseInt(accessLevel, 10);
    }
    const users = await findUsers(filters);
    res.status(200).send(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { username, email, password, accessLevel } = req.body;
    if (!isNonEmptyString(username) || !isEmail(email) || !minLength(password, 8)) {
      return res
        .status(400)
        .send({ error: 'username, email válido y password (mínimo 8 caracteres) son obligatorios' });
    }
    const level = accessLevel !== undefined && isInt(accessLevel) ? parseInt(accessLevel, 10) : ROLES.LECTOR;
    if (!isValidAccessLevel(level)) {
      return res.status(400).send({ error: 'accessLevel inválido' });
    }
    const user_id = await createUser(username.trim(), email.trim(), password, level);
    res.status(201).send({ message: 'Usuario creado con éxito', user_id });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).send({ error: 'El username o email ya está en uso' });
    }
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;
    if (!isNonEmptyString(username) || !isEmail(email)) {
      return res.status(400).send({ error: 'username y email válido son obligatorios' });
    }
    const target = await getUserById(id);
    if (!target) {
      return res.status(404).send({ error: 'Usuario no encontrado' });
    }
    await updateUser(id, { username: username.trim(), email: email.trim() });
    res.status(200).send({ message: 'Usuario actualizado con éxito' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).send({ error: 'El username o email ya está en uso' });
    }
    res.status(500).json({ error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).send({ error: 'isActive debe ser boolean' });
    }
    if (parseInt(id, 10) === req.user_id) {
      return res.status(409).send({ error: 'No puedes desactivarte a ti mismo' });
    }
    const target = await getUserById(id);
    if (!target) {
      return res.status(404).send({ error: 'Usuario no encontrado' });
    }
    if (!isActive && target.accessLevel === ROLES.ADMIN && target.isActive) {
      const activeAdmins = await countActiveAdmins();
      if (activeAdmins <= 1) {
        return res.status(409).send({ error: 'No puede quedar el sistema sin administradores activos' });
      }
    }
    await setUserStatus(id, isActive);
    res.status(200).send({ message: 'Estado actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { accessLevel } = req.body;
    const level = isInt(accessLevel) ? parseInt(accessLevel, 10) : null;
    if (!isValidAccessLevel(level)) {
      return res.status(400).send({ error: 'accessLevel inválido' });
    }
    if (parseInt(id, 10) === req.user_id) {
      return res.status(409).send({ error: 'No puedes cambiar tu propio rol' });
    }
    const target = await getUserById(id);
    if (!target) {
      return res.status(404).send({ error: 'Usuario no encontrado' });
    }
    if (target.accessLevel === ROLES.ADMIN && level !== ROLES.ADMIN && target.isActive) {
      const activeAdmins = await countActiveAdmins();
      if (activeAdmins <= 1) {
        return res.status(409).send({ error: 'No puede quedar el sistema sin administradores activos' });
      }
    }
    await setUserRole(id, level);
    res.status(200).send({ message: 'Rol actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!minLength(password, 8)) {
      return res.status(400).send({ error: 'password debe tener al menos 8 caracteres' });
    }
    const target = await getUserById(id);
    if (!target) {
      return res.status(404).send({ error: 'Usuario no encontrado' });
    }
    await setPassword(id, password, true);
    res.status(200).send({ message: 'Contraseña restablecida con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!isNonEmptyString(currentPassword) || !minLength(newPassword, 8)) {
      return res
        .status(400)
        .send({ error: 'currentPassword y newPassword (mínimo 8 caracteres) son obligatorios' });
    }
    const updated = await changeOwnPassword(req.user_id, currentPassword, newPassword);
    if (!updated) {
      return res.status(401).send({ error: 'La contraseña actual no es correcta' });
    }
    res.status(200).send({ message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  login,
  me,
  list,
  create,
  update,
  updateStatus,
  updateRole,
  resetPassword,
  changeMyPassword,
};
