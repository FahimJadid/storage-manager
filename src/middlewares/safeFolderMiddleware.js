const User = require('../models/User');
const { verifyPin } = require('../utils/pinUtils');

// Middleware to verify safe folder PIN
const verifySafeFolderAccess = async (req, res, next) => {
    try {
        const { pin } = req.body;
        const userId = req.user.id;

        if (!pin) {
            return res.status(400).json({ 
                success: false, 
                message: 'PIN is required for safe folder access' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (!user.safeFolderEnabled) {
            return res.status(400).json({ 
                success: false, 
                message: 'Safe folder is not enabled' 
            });
        }

        // Verify PIN
        if (!verifyPin(pin, user.safeFolderPin)) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid PIN' 
            });
        }

        // Add verified flag to request object
        req.safeFolderVerified = true;
        next();
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Error verifying safe folder access', 
            error: error.message 
        });
    }
};

module.exports = { verifySafeFolderAccess };
