const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { upload, handleMulterError } = require('../middlewares/uploadMiddleware');

// Route to upload a file (with multer middleware)
router.post('/upload', authMiddleware, upload.single('file'), handleMulterError, fileController.uploadFile);

// Route to upload multiple files
router.post('/upload-multiple', authMiddleware, upload.array('files', 5), handleMulterError, fileController.uploadMultipleFiles);

// Route to rename a file
router.put('/rename/:id', authMiddleware, fileController.renameFile);

// Route to delete a file
router.delete('/delete/:id', authMiddleware, fileController.deleteFile);

// Route to share a file
router.post('/share/:id', authMiddleware, fileController.shareFile);

// Route to add a file to favorites
router.post('/favorites/add/:id', authMiddleware, fileController.addToFavorites);

// Route to remove a file from favorites
router.delete('/favorites/remove/:id', authMiddleware, fileController.removeFromFavorites);

// Route to get all favorite files
router.get('/favorites', authMiddleware, fileController.getFavoriteFiles);

// Route to get files by folder (including root files)
router.get('/folder/:folderId', authMiddleware, fileController.getFilesByFolder);

// Route to update file privacy
router.put('/privacy/:id', authMiddleware, fileController.updateFilePrivacy);

// Route to get all files for a user
router.get('/', authMiddleware, fileController.getAllFiles);

// Route to get a specific file by ID
router.get('/:id', authMiddleware, fileController.getFileById);

// Route to download a file
router.get('/download/:id', authMiddleware, fileController.downloadFile);

module.exports = router;