const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// User signup
router.post('/signup', authController.signup);

// User login
router.post('/login', authController.login);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

router.post('/reset-password', authController.resetPassword);

// Middleware to protect routes
router.use(authMiddleware);

// Additional routes can be added here

module.exports = router;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

