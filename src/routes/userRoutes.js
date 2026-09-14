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

// Gestion du mot de passe par mail :
router.post('/request-password-reset', authMiddleware, userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword); // Publique (accessible depuis le lien mail)

module.exports = router;