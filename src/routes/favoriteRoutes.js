const express = require('express');
const { 
    addFavorite, 
    removeFavorite,
    removeFavoriteByItem,
    getFavorites,
    checkFavorite,
    getFavoriteCount
} = require('../controllers/favoriteController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route to get all favorite items
router.get('/', authMiddleware, getFavorites);

// Route to get favorite count
router.get('/count', authMiddleware, getFavoriteCount);

// Route to check if item is favorited
router.get('/check', authMiddleware, checkFavorite);

// Route to add a favorite item
router.post('/add', authMiddleware, addFavorite);

// Route to remove a favorite item by favorite ID
router.delete('/remove/:id', authMiddleware, removeFavorite);

// Route to remove a favorite item by item details
router.delete('/remove-item', authMiddleware, removeFavoriteByItem);

module.exports = router;