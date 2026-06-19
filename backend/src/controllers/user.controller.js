const { auth, getUsers } = require('./../services/user.service');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { nickname, password } = req.body;
    const response = await auth(nickname, password);
    if (response) {
      const payload = JSON.stringify(response);
      const token = jwt.sign(payload, process.env.SECRET);
      res.json({ estado: 200, error: null, data: { token } });
    } else {
      res.json({ estado: 204, error: 'error de usuario y/o contraseña', data: null });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  login,
  listUsers,
};
