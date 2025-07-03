const mongoose = require('mongoose');
const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const path = require('path');
const fs = require('fs');

const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024; // 15 GB

const getStorageInfo = async (userId) => {
    const user = await User.findById(userId).populate('folders').populate('files');
    
    if (!user) {
        throw new Error('User not found');
    }

    const totalStorageUsed = user.folders.reduce((acc, folder) => acc + folder.size, 0) +
                             user.files.reduce((acc, file) => acc + file.size, 0);

    return {
        totalStorage: STORAGE_LIMIT,
        usedStorage: totalStorageUsed,
        availableStorage: STORAGE_LIMIT - totalStorageUsed,
    };
};

const addFile = async (userId, fileData) => {
    const user = await User.findById(userId);
    
    if (!user) {
        throw new Error('User not found');
    }

    const storageInfo = await getStorageInfo(userId);
    
    if (storageInfo.availableStorage < fileData.size) {
        throw new Error('Not enough storage available');
    }

    const newFile = new File({
        ...fileData,
        user: userId,
    });

    await newFile.save();
    user.files.push(newFile);
    await user.save();

    return newFile;
};

const createFolder = async (userId, folderData) => {
    const user = await User.findById(userId);
    
    if (!user) {
        throw new Error('User not found');
    }

    const newFolder = new Folder({
        ...folderData,
        user: userId,
    });

    await newFolder.save();
    user.folders.push(newFolder);
    await user.save();

    return newFolder;
};

const deleteFile = async (userId, fileId) => {
    const user = await User.findById(userId);
    
    if (!user) {
        throw new Error('User not found');
    }

    const file = await File.findById(fileId);
    
    if (!file || file.user.toString() !== userId) {
        throw new Error('File not found or access denied');
    }

    await file.remove();
    user.files.pull(fileId);
    await user.save();
};

const deleteFolder = async (userId, folderId) => {
    const user = await User.findById(userId);
    
    if (!user) {
        throw new Error('User not found');
    }

    const folder = await Folder.findById(folderId);
    
    if (!folder || folder.user.toString() !== userId) {
        throw new Error('Folder not found or access denied');
    }

    await folder.remove();
    user.folders.pull(folderId);
    await user.save();
};

// Upload profile picture
const uploadProfilePicture = async (file) => {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            // Delete the uploaded file if invalid
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw new Error('Invalid file type. Only images are allowed.');
        }

        // Validate file size (max 5MB for profile pictures)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            // Delete the uploaded file if too large
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw new Error('File size too large. Maximum 5MB allowed for profile pictures.');
        }

        // Return the relative path to the uploaded file
        const relativePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
        return relativePath.startsWith('/') ? relativePath : '/' + relativePath;
        
    } catch (error) {
        // Clean up file on error
        if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw error;
    }
};

module.exports = {
    getStorageInfo,
    addFile,
    createFolder,
    deleteFile,
    deleteFolder,
    uploadProfilePicture,
};