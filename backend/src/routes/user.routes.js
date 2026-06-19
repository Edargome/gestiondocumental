const router = require('express').Router();
const authVerify = require('../middlewares/authVerify');
const { login, listUsers } = require('../controllers/user.controller');

router.post('/login', login);
router.get('/listuser', authVerify, listUsers);

module.exports = router;
