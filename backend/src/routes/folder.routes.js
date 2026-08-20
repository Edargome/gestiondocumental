const router = require('express').Router();
const authVerify = require('../middlewares/authVerify');
const {
  create,
  listFolderContents,
  getFolderTreeController,
  getFolderPath,
  searchController,
  deleteFolder,
  update_folder,
  moveFolderController,
} = require('../controllers/folder.controller');

router.post('/create', authVerify, create);
router.get('/search', authVerify, searchController);
router.get('/:folder_id/contents', authVerify, listFolderContents);
router.get('/:folder_id/tree', authVerify, getFolderTreeController);
router.post('/:folder_id/update', authVerify, update_folder);
router.get('/:folder_id/path', authVerify, getFolderPath);
router.delete('/:folder_id', authVerify, deleteFolder);
router.patch('/:folder_id/move', authVerify, moveFolderController);

module.exports = router;
