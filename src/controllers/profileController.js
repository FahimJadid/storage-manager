const User = require('../models/User');
const { uploadProfilePicture } = require('../services/storageService');
const path = require('path');
const fs = require('fs');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.status(200).json({ 
            success: true,
            message: 'Profile retrieved successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                settings: user.settings || {}
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error fetching profile', 
            error: error.message 
        });
    }
};

// Edit user profile
exports.editProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!username && !email) {
            return res.status(400).json({ 
                success: false,
                message: 'At least one field (username or email) is required' 
            });
        }

        // Build update object
        const updateData = {};
        if (username) {
            if (username.trim().length < 3) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Username must be at least 3 characters long' 
                });
            }
            updateData.username = username.trim();
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid email format' 
                });
            }

            // Check if email already exists
            const existingUser = await User.findOne({ 
                email: email.toLowerCase(), 
                _id: { $ne: userId } 
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Email already exists' 
                });
            }
            
            updateData.email = email.toLowerCase();
        }

        updateData.updatedAt = new Date();

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ 
            success: true,
            message: 'Profile updated successfully', 
            user: updatedUser 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error updating profile', 
            error: error.message 
        });
    }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No profile picture file uploaded' 
            });
        }

        // Get current user to check for existing profile picture
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Delete old profile picture if exists
        if (currentUser.profilePicture) {
            const oldPicturePath = path.join(process.cwd(), currentUser.profilePicture);
            if (fs.existsSync(oldPicturePath)) {
                try {
                    fs.unlinkSync(oldPicturePath);
                } catch (err) {
                    console.warn('Could not delete old profile picture:', err.message);
                }
            }
        }

        // Use storage service to handle upload
        let profilePictureUrl;
        try {
            profilePictureUrl = await uploadProfilePicture(req.file);
        } catch (uploadError) {
            return res.status(400).json({ 
                success: false,
                message: uploadError.message 
            });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { 
                profilePicture: profilePictureUrl,
                updatedAt: new Date()
            }, 
            { new: true }
        ).select('-password');

        res.status(200).json({ 
            success: true,
            message: 'Profile picture uploaded successfully', 
            user: updatedUser,
            profilePictureUrl: profilePictureUrl
        });
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.warn('Could not cleanup uploaded file:', cleanupError.message);
            }
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Error uploading profile picture', 
            error: error.message 
        });
    }
};

// Alternative profile picture upload (without storage service dependency)
exports.uploadProfilePictureSimple = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No profile picture file uploaded' 
            });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            // Delete the uploaded file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ 
                success: false,
                message: 'Invalid file type. Only images are allowed' 
            });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ 
                success: false,
                message: 'File size too large. Maximum 5MB allowed' 
            });
        }

        // Get current user
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Delete old profile picture if exists
        if (currentUser.profilePicture) {
            const oldPicturePath = path.join(process.cwd(), currentUser.profilePicture);
            if (fs.existsSync(oldPicturePath)) {
                try {
                    fs.unlinkSync(oldPicturePath);
                } catch (err) {
                    console.warn('Could not delete old profile picture:', err.message);
                }
            }
        }

        // Generate relative path for the uploaded file
        const relativePath = req.file.path.replace(process.cwd(), '').replace(/\\/g, '/');
        const profilePictureUrl = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
        
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { 
                profilePicture: profilePictureUrl,
                updatedAt: new Date()
            }, 
            { new: true }
        ).select('-password');

        res.status(200).json({ 
            success: true,
            message: 'Profile picture uploaded successfully', 
            user: updatedUser,
            profilePictureUrl: profilePictureUrl
        });
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.warn('Could not cleanup uploaded file:', cleanupError.message);
            }
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Error uploading profile picture', 
            error: error.message 
        });
    }
};

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        if (!user.profilePicture) {
            return res.status(400).json({ 
                success: false,
                message: 'No profile picture to delete' 
            });
        }

        // Delete the physical file
        const picturePath = path.join(process.cwd(), user.profilePicture);
        if (fs.existsSync(picturePath)) {
            fs.unlinkSync(picturePath);
        }

        // Update user record
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                profilePicture: null,
                updatedAt: new Date()
            },
            { new: true }
        ).select('-password');

        res.status(200).json({ 
            success: true,
            message: 'Profile picture deleted successfully', 
            user: updatedUser 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error deleting profile picture', 
            error: error.message 
        });
    }
};

// Get user settings
exports.getSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('settings username email');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.status(200).json({ 
            success: true,
            message: 'User settings retrieved successfully', 
            settings: user.settings || {},
            user: {
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error retrieving settings', 
            error: error.message 
        });
    }
};
