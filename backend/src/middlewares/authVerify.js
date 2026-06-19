const jwt = require('jsonwebtoken');
const { getLevel } = require('../services/user.service');
const authVerify = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send({ auth: false, message: 'No token provided.' });
  }
  jwt.verify(token.split(' ')[1], process.env.SECRET, async (err, decoded) => {
    if (err) {
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    }
    const level = await getLevel(decoded.user_id);
    // if everything is good, save to request for use in other routes
    req.user_id = decoded.user_id;
    req.accessLevel = level.accessLevel;
    next();
  });
};

module.exports = authVerify;
