const router = require('express').Router();
const upload = require('../utils/multerConfig');
const authVerify = require('../middlewares/authVerify');
const {
  uploadFile,
  updateFile,
  getFileMetadataAndVersions,
  downloadFile,
  downloadFileVersion,
  viewFile,
  getHistoryFile,
  deleteFile,
  moveFileController,
} = require('../controllers/file.controller');

router.post('/upload', authVerify, upload.single('file'), uploadFile);
router.put('/upload/:id_file', authVerify, upload.single('file'), updateFile);
router.get('/:file_id', authVerify, getFileMetadataAndVersions);
router.delete('/:file_id', authVerify, deleteFile);
router.get('/download/:file_id', authVerify, downloadFile);
router.get('/downloadVersion/:file_id/:version', authVerify, downloadFileVersion);
router.get('/view/:file_id', authVerify, viewFile);
router.get('/history/:file_id', authVerify, getHistoryFile);
router.patch('/:file_id/move', authVerify, moveFileController);

module.exports = router;
