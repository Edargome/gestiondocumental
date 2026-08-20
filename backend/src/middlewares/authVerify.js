const jwt = require('jsonwebtoken');
const { getLevel } = require('../services/user.service');

const authVerify = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).send({ auth: false, message: 'No token provided.' });
  }
  jwt.verify(token.split(' ')[1], process.env.SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).send({ auth: false, message: 'Failed to authenticate token.' });
    }
    try {
      const level = await getLevel(decoded.user_id);
      if (!level || !level.isActive) {
        return res.status(401).send({ auth: false, message: 'Usuario inactivo o inexistente.' });
      }
      // if everything is good, save to request for use in other routes
      req.user_id = decoded.user_id;
      req.accessLevel = level.accessLevel;
      next();
    } catch (error) {
      return res.status(500).send({ auth: false, message: 'Error al verificar el usuario.' });
    }
  });
};

module.exports = authVerify;
