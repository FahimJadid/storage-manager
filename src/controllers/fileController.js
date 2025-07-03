const File = require('../models/File');
const Folder = require('../models/Folder');
const path = require('path');
const fs = require('fs').promises;

// Upload/Create a new file
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { folderId } = req.body;
        const userId = req.user.id;

        // Validate folder if provided
        if (folderId) {
            const folder = await Folder.findOne({ _id: folderId, userId: userId });
            if (!folder) {
                return res.status(404).json({ message: 'Folder not found or access denied' });
            }
        }

        // Determine file type based on mimetype
        let fileType = 'note';
        if (req.file.mimetype.startsWith('image/')) {
            fileType = 'image';
        } else if (req.file.mimetype === 'application/pdf') {
            fileType = 'pdf';
        }

        const newFile = new File({ 
            folderId: folderId || null,
            name: req.file.originalname,
            type: fileType,
            size: req.file.size,
            userId: userId,
            filePath: req.file.path,
            mimeType: req.file.mimetype
        });

        await newFile.save();

        // Add file to folder if specified
        if (folderId) {
            await Folder.findByIdAndUpdate(folderId, {
                $push: { items: newFile._id },
                $inc: { storageUsed: req.file.size }
            });
        }

        res.status(201).json({ message: 'File uploaded successfully', file: newFile });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
};

// Upload multiple files
exports.uploadMultipleFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const { folderId } = req.body;
        const userId = req.user.id;

        // Validate folder if provided
        if (folderId) {
            const folder = await Folder.findOne({ _id: folderId, userId: userId });
            if (!folder) {
                return res.status(404).json({ message: 'Folder not found or access denied' });
            }
        }

        const uploadedFiles = [];
        let totalSize = 0;

        // Process each uploaded file
        for (const file of req.files) {
            // Determine file type based on mimetype
            let fileType = 'note';
            if (file.mimetype.startsWith('image/')) {
                fileType = 'image';
            } else if (file.mimetype === 'application/pdf') {
                fileType = 'pdf';
            }

            const newFile = new File({ 
                folderId: folderId || null,
                name: file.originalname,
                type: fileType,
                size: file.size,
                userId: userId,
                filePath: file.path,
                mimeType: file.mimetype
            });

            await newFile.save();
            uploadedFiles.push(newFile);
            totalSize += file.size;
        }

        // Add files to folder if specified
        if (folderId) {
            const fileIds = uploadedFiles.map(file => file._id);
            await Folder.findByIdAndUpdate(folderId, {
                $push: { items: { $each: fileIds } },
                $inc: { storageUsed: totalSize }
            });
        }

        res.status(201).json({ 
            message: `${uploadedFiles.length} files uploaded successfully`, 
            files: uploadedFiles,
            totalSize: totalSize
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading files', error: error.message });
    }
};

// Rename a file
exports.renameFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { newName } = req.body;
        const userId = req.user.id;

        if (!newName || newName.trim() === '') {
            return res.status(400).json({ message: 'New name is required' });
        }

        // Find the file and verify ownership
        const file = await File.findOne({ _id: id, userId: userId });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        const updatedFile = await File.findByIdAndUpdate(id, { 
            name: newName.trim(),
            updatedAt: new Date()
        }, { new: true });

        res.status(200).json({ message: 'File renamed successfully', file: updatedFile });
    } catch (error) {
        res.status(500).json({ message: 'Error renaming file', error: error.message });
    }
};

// Delete a file
exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the file and verify ownership
        const file = await File.findOne({ _id: id, userId: userId });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        // Delete physical file if it exists
        if (file.filePath) {
            try {
                await fs.unlink(file.filePath);
            } catch (err) {
                console.warn(`Could not delete physical file: ${file.filePath}`, err.message);
            }
        }

        // Remove file from folder if it's in one
        if (file.folderId) {
            await Folder.findByIdAndUpdate(file.folderId, {
                $pull: { items: file._id },
                $inc: { storageUsed: -file.size }
            });
        }

        await File.findByIdAndDelete(id);
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting file', error: error.message });
    }
};

// Share a file
exports.shareFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { sharedWith } = req.body;
        const userId = req.user.id;

        if (!sharedWith || sharedWith.trim() === '') {
            return res.status(400).json({ message: 'Email to share with is required' });
        }

        // Find the file and verify ownership
        const file = await File.findOne({ _id: id, userId: userId });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        if (!file.sharedWith) file.sharedWith = [];
        
        // Check if already shared with this user
        if (file.sharedWith.includes(sharedWith)) {
            return res.status(400).json({ message: 'File already shared with this user' });
        }

        file.sharedWith.push(sharedWith);
        file.updatedAt = new Date();
        await file.save();
        
        res.status(200).json({ message: 'File shared successfully', file });
    } catch (error) {
        res.status(500).json({ message: 'Error sharing file', error: error.message });
    }
};

// Add to favorites
exports.addToFavorites = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the file and verify ownership
        const file = await File.findOne({ _id: id, userId: userId });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        if (file.isFavorite) {
            return res.status(400).json({ message: 'File is already in favorites' });
        }

        file.isFavorite = true;
        file.updatedAt = new Date();
        await file.save();
        
        res.status(200).json({ message: 'File added to favorites', file });
    } catch (error) {
        res.status(500).json({ message: 'Error adding to favorites', error: error.message });
    }
};

// Remove from favorites
exports.removeFromFavorites = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the file and verify ownership
        const file = await File.findOne({ _id: id, userId: userId });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        if (!file.isFavorite) {
            return res.status(400).json({ message: 'File is not in favorites' });
        }

        file.isFavorite = false;
        file.updatedAt = new Date();
        await file.save();
        
        res.status(200).json({ message: 'File removed from favorites', file });
    } catch (error) {
        res.status(500).json({ message: 'Error removing from favorites', error: error.message });
    }
};

// Get all files for a user (excluding safe files)
exports.getAllFiles = async (req, res) => {
    try {
        const files = await File.find({ 
            userId: req.user.id, 
            $or: [
                { isSafe: { $exists: false } },
                { isSafe: false }
            ]
        });
        res.status(200).json({ files });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching files', error: error.message });
    }
};

// Get a specific file by ID
exports.getFileById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the file and verify ownership or shared access (excluding safe files unless specifically allowed)
        const file = await File.findOne({
            $and: [
                {
                    $or: [
                        { _id: id, userId: userId },
                        { _id: id, sharedWith: req.user.email }
                    ]
                },
                {
                    $or: [
                        { isSafe: { $exists: false } },
                        { isSafe: false }
                    ]
                }
            ]
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        res.status(200).json({ file });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching file', error: error.message });
    }
};

// Get all favorite files for a user (excluding safe files)
exports.getFavoriteFiles = async (req, res) => {
    try {
        const userId = req.user.id;
        const favoriteFiles = await File.find({ 
            userId: userId, 
            isFavorite: true,
            $or: [
                { isSafe: { $exists: false } },
                { isSafe: false }
            ]
        }).sort({ updatedAt: -1 });

        res.status(200).json({ files: favoriteFiles });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching favorite files', error: error.message });
    }
};

// Get files by folder
exports.getFilesByFolder = async (req, res) => {
    try {
        const { folderId } = req.params;
        const userId = req.user.id;

        // Verify folder ownership if folderId is provided
        if (folderId && folderId !== 'null') {
            const folder = await Folder.findOne({ _id: folderId, userId: userId });
            if (!folder) {
                return res.status(404).json({ message: 'Folder not found or access denied' });
            }
        }

        // Get files in folder or root files (folderId is null) - excluding safe files
        const query = { 
            userId: userId,
            $or: [
                { isSafe: { $exists: false } },
                { isSafe: false }
            ]
        };
        if (folderId === 'null') {
            query.folderId = null;
        } else {
            query.folderId = folderId;
        }

        const files = await File.find(query).sort({ updatedAt: -1 });

        res.status(200).json({ files });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching files by folder', error: error.message });
    }
};

// Update file privacy
exports.updateFilePrivacy = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPrivate } = req.body;
        const userId = req.user.id;

        // Find the file and verify ownership
        const file = await File.findOne({ _id: id, userId: userId });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        file.isPrivate = isPrivate;
        file.updatedAt = new Date();
        await file.save();
        
        res.status(200).json({ 
            message: `File ${isPrivate ? 'set to private' : 'made public'}`, 
            file 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating file privacy', error: error.message });
    }
};

// Download/serve a file
exports.downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the file and verify access (owner or shared) - excluding safe files
        const file = await File.findOne({
            $and: [
                {
                    $or: [
                        { _id: id, userId: userId },
                        { _id: id, sharedWith: req.user.email, isPrivate: false }
                    ]
                },
                {
                    $or: [
                        { isSafe: { $exists: false } },
                        { isSafe: false }
                    ]
                }
            ]
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        // Check if physical file exists
        if (!file.filePath || !await fs.access(file.filePath).then(() => true).catch(() => false)) {
            return res.status(404).json({ message: 'Physical file not found' });
        }

        // Set appropriate headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');

        // Stream the file
        const fileStream = require('fs').createReadStream(file.filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error downloading file', error: error.message });
    }
};