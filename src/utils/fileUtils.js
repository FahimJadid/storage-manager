const fs = require('fs').promises;
const path = require('path');

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
        await fs.access(uploadsDir);
    } catch (error) {
        // Directory doesn't exist, create it
        await fs.mkdir(uploadsDir, { recursive: true });
        console.log('Created uploads directory');
    }
};

// Get file extension from filename
const getFileExtension = (filename) => {
    return path.extname(filename).toLowerCase();
};

// Validate file type
const isValidFileType = (mimetype) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(mimetype);
};

// Format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
    ensureUploadsDir,
    getFileExtension,
    isValidFileType,
    formatFileSize
};
