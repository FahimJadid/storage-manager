const express = require('express');
const { 
    editProfile, 
    getProfile, 
    uploadProfilePictureSimple, 
    deleteProfilePicture,
    getSettings,
    updateSettings
} = require('../controllers/profileController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Route to get user profile
router.get('/', authMiddleware, getProfile);

// Route to edit user profile
router.put('/', authMiddleware, editProfile);

// Route to upload profile picture (using simple method)
router.post('/picture', authMiddleware, upload.single('profilePicture'), uploadProfilePictureSimple);

// Route to delete profile picture
router.delete('/picture', authMiddleware, deleteProfilePicture);

// Route to get user settings
router.get('/settings', authMiddleware, getSettings);

module.exports = router;