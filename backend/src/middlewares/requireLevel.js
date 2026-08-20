const { isAtLeast } = require('../utils/roles');

const requireLevel = (minLevel) => (req, res, next) => {
  if (!isAtLeast(req.accessLevel, minLevel)) {
    return res.status(403).send({ error: 'No tienes permiso para realizar esta acción' });
  }
  next();
};

module.exports = requireLevel;
