const router = require('express').Router();
const {
  getPermissionByUser,
  setPermissionByUser,
} = require('../controllers/permission.controller');
const authVerify = require('../middlewares/authVerify');

router.get('/:file_id', authVerify, getPermissionByUser);
router.post('/:file_id', authVerify, setPermissionByUser);

module.exports = router;
