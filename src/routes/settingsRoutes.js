const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Change password route
router.put('/change-password', authMiddleware, settingsController.changePassword);

// Clear all user data
router.delete('/clear-data', authMiddleware, settingsController.clearAllData);

// Delete account route
router.delete('/delete-account', authMiddleware, settingsController.deleteAccount);

// Logout route
router.post('/logout', authMiddleware, settingsController.logout);

module.exports = router;