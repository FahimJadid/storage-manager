const express = require('express');
const { 
    filterByDate, 
    getDailyActivity, 
    getMonthlyActivity, 
    getRecentActivity 
} = require('../controllers/calendarController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to filter files and folders by date range
router.get('/filter', authMiddleware, filterByDate);

// Route to get daily activity
router.get('/daily', authMiddleware, getDailyActivity);

// Route to get monthly activity
router.get('/monthly', authMiddleware, getMonthlyActivity);

// Route to get recent activity
router.get('/recent', authMiddleware, getRecentActivity);

module.exports = router;