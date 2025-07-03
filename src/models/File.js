const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['note', 'image', 'pdf'],
        required: true
    },
    size: {
        type: Number, // Size in bytes
        required: true
    },
    filePath: {
        type: String // Physical file path on server
    },
    mimeType: {
        type: String // MIME type of the file
    },
    isFavorite: {
        type: Boolean,
        default: false
    },
    sharedWith: [{
        type: String // Array of email addresses
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    isSafe: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('File', fileSchema);