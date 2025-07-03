const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const errorHandler = require('./middlewares/errorHandler');
const { handleMulterError } = require('./middlewares/uploadMiddleware');
const emailService = require('./services/emailService');
const { ensureUploadsDir } = require('./utils/fileUtils');

// Initialize services
emailService.init();
ensureUploadsDir(); // Ensure uploads directory exists
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const folderRoutes = require('./routes/folderRoutes');
const profileRoutes = require('./routes/profileRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const safeFolderRoutes = require('./routes/safeFolderRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/safe-folder', safeFolderRoutes);

// Error handling middleware
app.use(handleMulterError); // Handle multer-specific errors first
app.use(errorHandler);

module.exports = app;