const router = require('express').Router();
const authVerify = require('../middlewares/authVerify');
const requireLevel = require('../middlewares/requireLevel');
const { loginRateLimit } = require('../middlewares/loginRateLimit');
const { ROLES } = require('../utils/roles');
const {
  login,
  me,
  list,
  create,
  update,
  updateStatus,
  updateRole,
  resetPassword,
  changeMyPassword,
} = require('../controllers/user.controller');

const requireAdmin = requireLevel(ROLES.ADMIN);

router.post('/login', loginRateLimit, login);

router.get('/me', authVerify, me);
router.patch('/me/password', authVerify, changeMyPassword);

router.get('/', authVerify, requireAdmin, list);
router.post('/', authVerify, requireAdmin, create);
router.patch('/:id', authVerify, requireAdmin, update);
router.patch('/:id/status', authVerify, requireAdmin, updateStatus);
router.patch('/:id/role', authVerify, requireAdmin, updateRole);
router.patch('/:id/password', authVerify, requireAdmin, resetPassword);

module.exports = router;
