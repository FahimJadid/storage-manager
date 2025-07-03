const express = require('express');
const router = express.Router();
const safeFolderController = require('../controllers/safeFolderController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { verifySafeFolderAccess } = require('../middlewares/safeFolderMiddleware');

// Route to get safe folder status
router.get('/status', authMiddleware, safeFolderController.getSafeFolderStatus);

// Route to enable safe folder
router.post('/enable', authMiddleware, safeFolderController.enableSafeFolder);

// Route to disable safe folder
router.post('/disable', authMiddleware, safeFolderController.disableSafeFolder);

// Route to change safe folder PIN (supports both PUT and POST)
router.put('/change-pin', authMiddleware, safeFolderController.changeSafeFolderPin);
router.post('/change-pin', authMiddleware, safeFolderController.changeSafeFolderPin);

// Route to verify safe folder PIN
router.post('/verify-pin', authMiddleware, safeFolderController.verifySafeFolderPin);

// Route to get safe files (requires PIN)
router.post('/files', authMiddleware, safeFolderController.getSafeFiles);

// Route to move file to safe folder
router.post('/move-to-safe', authMiddleware, safeFolderController.moveFileToSafe);

// Route to move file from safe folder
router.post('/move-from-safe', authMiddleware, safeFolderController.moveFileFromSafe);

// Route to get specific safe file by ID (requires PIN)
router.post('/file/:id', authMiddleware, safeFolderController.getSafeFileById);

// Route to download safe file (requires PIN)
router.post('/download/:id', authMiddleware, safeFolderController.downloadSafeFile);

module.exports = router;
