const Favorite = require('../models/Favorite');
const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');

// Add a favorite item
exports.addFavorite = async (req, res) => {
    try {
        const { itemId, itemType } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!itemId || !itemType) {
            return res.status(400).json({ 
                success: false, 
                message: 'itemId and itemType are required' 
            });
        }

        // Validate itemType
        if (!['File', 'Folder'].includes(itemType)) {
            return res.status(400).json({ 
                success: false, 
                message: 'itemType must be either "File" or "Folder"' 
            });
        }

        // Check if item exists and user has access (excluding safe files from favorites)
        let item;
        if (itemType === 'File') {
            item = await File.findOne({ 
                _id: itemId, 
                userId: userId,
                $or: [
                    { isSafe: { $exists: false } },
                    { isSafe: false }
                ]
            });
        } else if (itemType === 'Folder') {
            item = await Folder.findOne({ _id: itemId, userId: userId });
        }

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: `${itemType} not found or access denied` 
            });
        }

        // Check if already in favorites
        const existingFavorite = await Favorite.findOne({ 
            userId, 
            itemId, 
            itemType 
        });

        if (existingFavorite) {
            return res.status(400).json({ 
                success: false, 
                message: `${itemType} is already in favorites` 
            });
        }

        const favorite = await Favorite.create({ userId, itemId, itemType });
        
        // Populate the item details
        await favorite.populate('itemId');

        res.status(201).json({ 
            success: true, 
            message: `${itemType} added to favorites successfully`,
            favorite 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove a favorite item
exports.removeFavorite = async (req, res) => {
    try {
        const { id } = req.params; // Changed from favoriteId to id to match route
        const userId = req.user.id;

        // Find and verify ownership before deletion
        const favorite = await Favorite.findOne({ _id: id, userId: userId });

        if (!favorite) {
            return res.status(404).json({ 
                success: false, 
                message: 'Favorite not found or access denied' 
            });
        }

        await Favorite.findByIdAndDelete(id);
        
        res.status(200).json({ 
            success: true, 
            message: 'Favorite removed successfully' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove favorite by item ID and type (alternative method)
exports.removeFavoriteByItem = async (req, res) => {
    try {
        const { itemId, itemType } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!itemId || !itemType) {
            return res.status(400).json({ 
                success: false, 
                message: 'itemId and itemType are required' 
            });
        }

        const favorite = await Favorite.findOneAndDelete({ 
            userId, 
            itemId, 
            itemType 
        });

        if (!favorite) {
            return res.status(404).json({ 
                success: false, 
                message: 'Favorite not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: `${itemType} removed from favorites successfully` 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Check if an item is favorited
exports.checkFavorite = async (req, res) => {
    try {
        const { itemId, itemType } = req.query;
        const userId = req.user.id;

        // Validate required fields
        if (!itemId || !itemType) {
            return res.status(400).json({ 
                success: false, 
                message: 'itemId and itemType are required as query parameters' 
            });
        }

        const favorite = await Favorite.findOne({ 
            userId, 
            itemId, 
            itemType 
        });

        res.status(200).json({ 
            success: true, 
            isFavorite: !!favorite,
            favoriteId: favorite ? favorite._id : null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get favorite count
exports.getFavoriteCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const totalCount = await Favorite.countDocuments({ userId });
        const fileCount = await Favorite.countDocuments({ userId, itemType: 'File' });
        const folderCount = await Favorite.countDocuments({ userId, itemType: 'Folder' });

        res.status(200).json({ 
            success: true, 
            count: {
                total: totalCount,
                files: fileCount,
                folders: folderCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all favorite items
exports.getFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.query; // Optional filter by type

        let query = { userId };
        if (type && ['File', 'Folder'].includes(type)) {
            query.itemType = type;
        }

        const favorites = await Favorite.find(query)
            .populate('itemId')
            .sort({ createdAt: -1 });

        // Filter out favorites that reference safe files
        const filteredFavorites = favorites.filter(fav => {
            if (fav.itemType === 'File' && fav.itemId) {
                // Exclude safe files from favorites
                return !fav.itemId.isSafe;
            }
            return true; // Keep folders and other items
        });

        // Separate files and folders for better organization
        const files = filteredFavorites.filter(fav => fav.itemType === 'File');
        const folders = filteredFavorites.filter(fav => fav.itemType === 'Folder');

        res.status(200).json({ 
            success: true, 
            total: filteredFavorites.length,
            files: files.length,
            folders: folders.length,
            favorites: {
                all: filteredFavorites,
                files: files,
                folders: folders
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};