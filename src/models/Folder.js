const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    storageUsed: {
        type: Number,
        default: 0 // in MB
    }
});

folderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;