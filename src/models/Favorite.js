const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'itemType'
    },
    itemType: {
        type: String,
        required: true,
        enum: ['File', 'Folder']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to prevent duplicate favorites
favoriteSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });

// Index for faster queries
favoriteSchema.index({ userId: 1, itemType: 1 });
favoriteSchema.index({ userId: 1, createdAt: -1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;