const Folder = require('../models/Folder');
const User = require('../models/User');
const File = require('../models/File');

// Create a new folder
exports.createFolder = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Folder name is required' });
        }

        // Check if folder with same name already exists for this user
        const existingFolder = await Folder.findOne({ 
            userId: userId, 
            name: name.trim() 
        });

        if (existingFolder) {
            return res.status(400).json({ message: 'Folder with this name already exists' });
        }

        const newFolder = new Folder({
            name: name.trim(),
            userId: userId,
            items: [],
            storageUsed: 0,
        });

        await newFolder.save();
        res.status(201).json({ message: 'Folder created successfully', folder: newFolder });
    } catch (error) {
        res.status(500).json({ message: 'Error creating folder', error: error.message });
    }
};

// Get all folders for a user
exports.getAllFolders = async (req, res) => {
    try {
        const userId = req.user.id;
        const folders = await Folder.find({ userId: userId });

        res.status(200).json(folders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching folders', error: error.message });
    }
};

// Update folder details
exports.updateFolder = async (req, res) => {
    try {
        const { folderId } = req.params;
        const { name } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Folder name is required' });
        }

        // Find the folder and verify ownership
        const folder = await Folder.findOne({ _id: folderId, userId: userId });
        
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found or access denied' });
        }

        // Check if another folder with same name already exists for this user
        const existingFolder = await Folder.findOne({ 
            userId: userId, 
            name: name.trim(),
            _id: { $ne: folderId } // Exclude current folder
        });

        if (existingFolder) {
            return res.status(400).json({ message: 'Folder with this name already exists' });
        }

        const updatedFolder = await Folder.findByIdAndUpdate(
            folderId, 
            { name: name.trim(), updatedAt: new Date() }, 
            { new: true }
        );

        res.status(200).json({ message: 'Folder updated successfully', folder: updatedFolder });
    } catch (error) {
        res.status(500).json({ message: 'Error updating folder', error: error.message });
    }
};

// Delete a folder
exports.deleteFolder = async (req, res) => {
    try {
        const { folderId } = req.params;
        const userId = req.user.id;

        // Find the folder and verify ownership
        const folder = await Folder.findOne({ _id: folderId, userId: userId }).populate('items');
        
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found or access denied' });
        }

        // Check if folder has files
        if (folder.items && folder.items.length > 0) {
            return res.status(400).json({ 
                message: `Cannot delete folder. It contains ${folder.items.length} file(s). Please move or delete the files first.`,
                fileCount: folder.items.length
            });
        }

        await Folder.findByIdAndDelete(folderId);

        res.status(200).json({ 
            message: 'Folder deleted successfully',
            deletedFolder: {
                id: folder._id,
                name: folder.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting folder', error: error.message });
    }
};

// Get folder details including storage consumption
exports.getFolderDetails = async (req, res) => {
    try {
        const { folderId } = req.params;
        const userId = req.user.id;

        // Find the folder and verify ownership
        const folder = await Folder.findOne({ _id: folderId, userId: userId }).populate('items');

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found or access denied' });
        }

        res.status(200).json(folder);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching folder details', error: error.message });
    }
};

exports.getStorageConsumption = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all folders for this user and calculate total storage
        const folders = await Folder.find({ userId: userId });

        if (!folders) {
            return res.status(200).json({ 
                storageUsed: 0,
                totalFolders: 0,
                folders: []
            });
        }

        const totalStorageUsed = folders.reduce((total, folder) => {
            return total + (folder.storageUsed || 0);
        }, 0);

        // Convert bytes to MB for better readability
        const storageInMB = totalStorageUsed / (1024 * 1024);

        res.status(200).json({ 
            storageUsed: totalStorageUsed, // in bytes
            storageUsedMB: Math.round(storageInMB * 100) / 100, // in MB, rounded to 2 decimal places
            totalFolders: folders.length,
            folders: folders.map(folder => ({
                id: folder._id,
                name: folder.name,
                storageUsed: folder.storageUsed,
                storageUsedMB: Math.round((folder.storageUsed / (1024 * 1024)) * 100) / 100,
                itemCount: folder.items.length
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching storage consumption', error: error.message });
    }
};