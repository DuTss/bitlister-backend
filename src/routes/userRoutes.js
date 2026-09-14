const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

// --- Routes Profil ---
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

// --- Routes Favoris ---
router.get('/favorites', authMiddleware, userController.getFavorites);
router.post('/favorites/:listingId', authMiddleware, userController.toggleFavorite);

module.exports = router;