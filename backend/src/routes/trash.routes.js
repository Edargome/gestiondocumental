const router = require('express').Router();
const authVerify = require('../middlewares/authVerify');
const {
  getTrash,
  restoreFileController,
  restoreFolderController,
} = require('../controllers/trash.controller');

router.get('/', authVerify, getTrash);
router.put('/files/:file_id/restore', authVerify, restoreFileController);
router.put('/folders/:folder_id/restore', authVerify, restoreFolderController);

module.exports = router;
