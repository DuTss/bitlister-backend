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
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword); // Publique (accessible depuis le lien mail)

router.post('/verify-email', userController.verifyEmail);

// Enregistrer/mettre à jour sa propre clé publique
router.put('/:id/public-key', async (req, res) => {
  try {
    const { publicKey } = req.body;
    await User.findByIdAndUpdate(req.params.id, { publicKey });
    res.json({ message: 'Clé publique mise à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la sauvegarde de la clé.' });
  }
});

// Récupérer la clé publique d'un utilisateur par son ID
router.get('/:id/public-key', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('publicKey');
    if (!user || !user.publicKey) {
      return res.status(404).json({ message: 'Clé publique non trouvée.' });
    }
    res.json({ publicKey: user.publicKey });
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération clé.' });
  }
});

module.exports = router;