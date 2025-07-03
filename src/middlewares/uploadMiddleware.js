const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory to store uploaded files
  },
  filename: (req, file, cb) => {
    // Create a more secure filename with user ID and timestamp
    const userId = req.user ? req.user.id : 'anonymous';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${userId}_${uniqueSuffix}_${sanitizedName}`);
  }
});

// Define allowed file types with their MIME types
const allowedMimeTypes = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  // Text files
  'text/plain': ['.txt'],
  'text/markdown': ['.md']
};

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    // Check if MIME type is allowed
    if (!allowedMimeTypes[mimeType]) {
      return cb(new Error(`File type ${mimeType} is not supported. Allowed types: ${Object.keys(allowedMimeTypes).join(', ')}`));
    }

    // Check if file extension matches the MIME type
    const allowedExtensions = allowedMimeTypes[mimeType];
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error(`File extension ${fileExtension} does not match MIME type ${mimeType}`));
    }

    // Additional security: Check for dangerous file names
    const dangerousPatterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.pif$/i];
    if (dangerousPatterns.some(pattern => pattern.test(file.originalname))) {
      return cb(new Error('Potentially dangerous file type detected'));
    }

    cb(null, true);
  } catch (error) {
    cb(new Error(`File validation error: ${error.message}`));
  }
};

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 15 * 1024 * 1024, // 15 MB limit
    files: 5, // Maximum 5 files at once
    fieldSize: 1024 * 1024 // 1MB field size limit
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer errors
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          message: 'File too large. Maximum size is 15MB.' 
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          message: 'Too many files. Maximum is 5 files at once.' 
        });
      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({ 
          message: 'Field value too large.' 
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          message: 'Unexpected field name for file upload.' 
        });
      default:
        return res.status(400).json({ 
          message: `Upload error: ${error.message}` 
        });
    }
  }
  
  // Handle custom file filter errors
  if (error.message.includes('File type') || error.message.includes('File extension') || error.message.includes('dangerous')) {
    return res.status(400).json({ 
      message: error.message 
    });
  }

  next(error);
};

// Export both upload middleware and error handler
module.exports = {
  upload,
  handleMulterError,
  allowedMimeTypes // Export for reference in other files
};