const User = require('../models/User');
const File = require('../models/File');
const { generatePin, hashPin, verifyPin } = require('../utils/pinUtils');

// Enable safe folder with PIN
exports.enableSafeFolder = async (req, res) => {
    try {
        const { pin } = req.body;
        const userId = req.user.id;

        // Validate PIN
        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({ 
                success: false, 
                message: 'PIN must be exactly 4 digits' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if safe folder is already enabled
        if (user.safeFolderEnabled) {
            return res.status(400).json({ 
                success: false, 
                message: 'Safe folder is already enabled' 
            });
        }

        // Hash the PIN and enable safe folder
        const hashedPin = hashPin(pin);
        user.safeFolderPin = hashedPin;
        user.safeFolderEnabled = true;
        user.updatedAt = new Date();

        await user.save();

        res.status(200).json({ 
            success: true, 
            message: 'Safe folder enabled successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error enabling safe folder', 
            error: error.message 
        });
    }
};

// Disable safe folder
exports.disableSafeFolder = async (req, res) => {
    try {
        const { pin } = req.body;
        const userId = req.user.id;

        if (!pin) {
            return res.status(400).json({ 
                success: false, 
                message: 'PIN is required to disable safe folder' 
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
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid PIN' 
            });
        }

        // Move all safe files to regular files before disabling
        await File.updateMany(
            { userId: userId, isSafe: true },
            { $unset: { isSafe: "" } }
        );

        // Disable safe folder
        user.safeFolderPin = null;
        user.safeFolderEnabled = false;
        user.updatedAt = new Date();

        await user.save();

        res.status(200).json({ 
            success: true, 
            message: 'Safe folder disabled successfully. All safe files moved to regular files.' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error disabling safe folder', 
            error: error.message 
        });
    }
};

// Change safe folder PIN
exports.changeSafeFolderPin = async (req, res) => {
    try {
        const { currentPin, newPin } = req.body;
        const userId = req.user.id;

        // Validate inputs
        if (!currentPin || !newPin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Both current PIN and new PIN are required' 
            });
        }

        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            return res.status(400).json({ 
                success: false, 
                message: 'New PIN must be exactly 4 digits' 
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

        // Verify current PIN
        if (!verifyPin(currentPin, user.safeFolderPin)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid current PIN' 
            });
        }

        // Update PIN
        const hashedNewPin = hashPin(newPin);
        user.safeFolderPin = hashedNewPin;
        user.updatedAt = new Date();

        await user.save();

        res.status(200).json({ 
            success: true, 
            message: 'Safe folder PIN changed successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error changing safe folder PIN', 
            error: error.message 
        });
    }
};

// Verify safe folder PIN
exports.verifySafeFolderPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const userId = req.user.id;

        if (!pin) {
            return res.status(400).json({ 
                success: false, 
                message: 'PIN is required' 
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
        const isValid = verifyPin(pin, user.safeFolderPin);

        res.status(200).json({ 
            success: true, 
            valid: isValid,
            message: isValid ? 'PIN verified successfully' : 'Invalid PIN'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error verifying PIN', 
            error: error.message 
        });
    }
};

// Get safe folder status
exports.getSafeFolderStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Count safe files
        const safeFileCount = await File.countDocuments({ 
            userId: userId, 
            isSafe: true 
        });

        res.status(200).json({ 
            success: true, 
            safeFolderEnabled: user.safeFolderEnabled,
            safeFileCount: safeFileCount
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error getting safe folder status', 
            error: error.message 
        });
    }
};

// Get safe files (requires PIN verification)
exports.getSafeFiles = async (req, res) => {
    try {
        const { pin } = req.body;
        const userId = req.user.id;

        if (!pin) {
            return res.status(400).json({ 
                success: false, 
                message: 'PIN is required to access safe files' 
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
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid PIN' 
            });
        }

        // Get safe files
        const safeFiles = await File.find({ 
            userId: userId, 
            isSafe: true 
        }).sort({ updatedAt: -1 });

        res.status(200).json({ 
            success: true, 
            files: safeFiles
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error getting safe files', 
            error: error.message 
        });
    }
};

// Move file to safe folder
exports.moveFileToSafe = async (req, res) => {
    try {
        const { fileId, pin } = req.body;
        const userId = req.user.id;

        if (!fileId || !pin) {
            return res.status(400).json({ 
                success: false, 
                message: 'File ID and PIN are required' 
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
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid PIN' 
            });
        }

        // Find and verify file ownership
        const file = await File.findOne({ _id: fileId, userId: userId });
        if (!file) {
            return res.status(404).json({ 
                success: false, 
                message: 'File not found or access denied' 
            });
        }

        if (file.isSafe) {
            return res.status(400).json({ 
                success: false, 
                message: 'File is already in safe folder' 
            });
        }

        // Move file to safe folder
        file.isSafe = true;
        file.updatedAt = new Date();
        await file.save();

        res.status(200).json({ 
            success: true, 
            message: 'File moved to safe folder successfully',
            file: file
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error moving file to safe folder', 
            error: error.message 
        });
    }
};

// Move file from safe folder to regular files
exports.moveFileFromSafe = async (req, res) => {
    try {
        const { fileId, pin } = req.body;
        const userId = req.user.id;

        if (!fileId || !pin) {
            return res.status(400).json({ 
                success: false, 
                message: 'File ID and PIN are required' 
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
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid PIN' 
            });
        }

        // Find and verify file ownership
        const file = await File.findOne({ _id: fileId, userId: userId, isSafe: true });
        if (!file) {
            return res.status(404).json({ 
                success: false, 
                message: 'Safe file not found or access denied' 
            });
        }

        // Move file from safe folder to regular files
        file.isSafe = false;
        file.updatedAt = new Date();
        await file.save();

        res.status(200).json({ 
            success: true, 
            message: 'File moved from safe folder successfully',
            file: file
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error moving file from safe folder', 
            error: error.message 
        });
    }
};

// Get specific safe file by ID (requires PIN)
exports.getSafeFileById = async (req, res) => {
    try {
        const { id } = req.params;
        const { pin } = req.body;
        const userId = req.user.id;

        if (!pin) {
            return res.status(400).json({ 
                success: false, 
                message: 'PIN is required to access safe file' 
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
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid PIN' 
            });
        }

        // Find safe file
        const file = await File.findOne({ 
            _id: id, 
            userId: userId, 
            isSafe: true 
        });

        if (!file) {
            return res.status(404).json({ 
                success: false, 
                message: 'Safe file not found or access denied' 
            });
        }

        res.status(200).json({ 
            success: true, 
            file: file
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error getting safe file', 
            error: error.message 
        });
    }
};

// Download safe file (requires PIN)
exports.downloadSafeFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { pin } = req.body;
        const userId = req.user.id;

        if (!pin) {
            return res.status(400).json({ 
                success: false, 
                message: 'PIN is required to download safe file' 
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
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid PIN' 
            });
        }

        // Find safe file
        const file = await File.findOne({ 
            _id: id, 
            userId: userId, 
            isSafe: true 
        });

        if (!file) {
            return res.status(404).json({ 
                success: false, 
                message: 'Safe file not found or access denied' 
            });
        }

        if (!file.filePath) {
            return res.status(404).json({ 
                success: false, 
                message: 'File path not found' 
            });
        }

        // Check if file exists on filesystem
        const fs = require('fs');
        if (!fs.existsSync(file.filePath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Physical file not found on server' 
            });
        }

        // Set appropriate headers and send file
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        
        // Send file
        res.sendFile(file.filePath, (err) => {
            if (err) {
                console.error('Error sending safe file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ 
                        success: false, 
                        message: 'Error downloading safe file' 
                    });
                }
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error downloading safe file', 
            error: error.message 
        });
    }
};
