const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Route to create a new folder
router.post('/', authMiddleware, folderController.createFolder);

// Route to get all folders for a user
router.get('/', authMiddleware, folderController.getAllFolders);

// Route to get storage consumption details (MUST come before /:folderId)
router.get('/storage', authMiddleware, folderController.getStorageConsumption);

// Route to get a specific folder by ID
router.get('/:folderId', authMiddleware, folderController.getFolderDetails);

// Route to update a folder (e.g., rename)
router.put('/:folderId', authMiddleware, folderController.updateFolder);

// Route to delete a folder
router.delete('/:folderId', authMiddleware, folderController.deleteFolder);

module.exports = router;