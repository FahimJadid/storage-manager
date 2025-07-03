const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const Favorite = require('../models/Favorite');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false,
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'New password must be at least 6 characters long' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: 'Current password is incorrect' 
            });
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ 
                success: false,
                message: 'New password must be different from current password' 
            });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.updatedAt = new Date();
        await user.save();

        res.status(200).json({ 
            success: true,
            message: 'Password changed successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Delete Account
exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        // Require password confirmation for security
        if (!password) {
            return res.status(400).json({ 
                success: false,
                message: 'Password confirmation is required to delete account' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: 'Incorrect password' 
            });
        }

        // Delete user's files from filesystem
        const userFiles = await File.find({ userId: userId });
        for (const file of userFiles) {
            if (file.filePath && fs.existsSync(file.filePath)) {
                try {
                    fs.unlinkSync(file.filePath);
                } catch (err) {
                    console.warn(`Could not delete file: ${file.filePath}`, err.message);
                }
            }
        }

        // Delete profile picture if exists
        if (user.profilePicture) {
            const picturePath = path.join(process.cwd(), user.profilePicture);
            if (fs.existsSync(picturePath)) {
                try {
                    fs.unlinkSync(picturePath);
                } catch (err) {
                    console.warn(`Could not delete profile picture: ${picturePath}`, err.message);
                }
            }
        }

        // Delete all related data
        await Promise.all([
            File.deleteMany({ userId: userId }),
            Folder.deleteMany({ userId: userId }),
            Favorite.deleteMany({ userId: userId }),
            User.findByIdAndDelete(userId)
        ]);

        res.status(200).json({ 
            success: true,
            message: 'Account and all associated data deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};


// Clear all user data (except account)
exports.clearAllData = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        if (!password) {
            return res.status(400).json({ 
                success: false,
                message: 'Password confirmation is required' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: 'Incorrect password' 
            });
        }

        // Delete files from filesystem
        const userFiles = await File.find({ userId: userId });
        for (const file of userFiles) {
            if (file.filePath && fs.existsSync(file.filePath)) {
                try {
                    fs.unlinkSync(file.filePath);
                } catch (err) {
                    console.warn(`Could not delete file: ${file.filePath}`, err.message);
                }
            }
        }

        // Clear all user data but keep the account
        await Promise.all([
            File.deleteMany({ userId: userId }),
            Folder.deleteMany({ userId: userId }),
            Favorite.deleteMany({ userId: userId })
        ]);

        res.status(200).json({ 
            success: true,
            message: 'All user data cleared successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error clearing user data', 
            error: error.message 
        });
    }
};

// Logout user
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user to verify they exist
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // For now, we'll just update the user's last activity
        await User.findByIdAndUpdate(userId, {
            updatedAt: new Date()
        });

        res.status(200).json({ 
            success: true,
            message: 'Logged out successfully',
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error during logout', 
            error: error.message 
        });
    }
};