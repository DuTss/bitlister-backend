const User = require('../models/User');
const Listing = require('../models/Listing');
const bcrypt = require('bcryptjs');

// 1. Récupérer le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil.', error: error.message });
  }
};

// 2. Mettre à jour le profil (pseudo, adresse Lightning, mot de passe)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { pseudo, lightningAddress, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Validation de l'adresse Lightning si renseignée
    if (lightningAddress !== undefined) {
      if (lightningAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lightningAddress)) {
        return res.status(400).json({ message: "L'adresse Lightning doit respecter un format valide (ex: pseudo@provider.com)." });
      }
      user.lightningAddress = lightningAddress.trim();
    }

    // Modification du pseudo
    if (pseudo && pseudo.trim() !== user.pseudo) {
      user.pseudo = pseudo.trim();
    }

    // Modification du mot de passe (optionnelle)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Veuillez saisir votre mot de passe actuel pour le modifier.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Le mot de passe actuel est incorrect.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // Retourne le profil mis à jour sans le mot de passe
    const updatedUser = await User.findById(userId).select('-password');
    res.json({
      message: 'Profil mis à jour avec succès.',
      user: updatedUser,
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.', error: error.message });
  }
};

// 3. Ajouter ou retirer une annonce des favoris (Toggle)
exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { listingId } = req.params;

    // Vérifier si l'annonce existe
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Annonce introuvable.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Vérifier si l'annonce est déjà dans les favoris
    const favoriteIndex = user.favorites.indexOf(listingId);

    if (favoriteIndex > -1) {
      // Si présente -> On la retire
      user.favorites.splice(favoriteIndex, 1);
      await user.save();
      return res.json({
        message: 'Annonce retirée des favoris',
        isFavorite: false,
        favorites: user.favorites,
      });
    } else {
      // Sinon -> On l'ajoute
      user.favorites.push(listingId);
      await user.save();
      return res.json({
        message: 'Annonce ajoutée aux favoris',
        isFavorite: true,
        favorites: user.favorites,
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la gestion des favoris.', error: error.message });
  }
};

// 4. Récupérer la liste des annonces favorites de l'utilisateur
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;

    const user = await User.findById(userId).populate({
      path: 'favorites',
      populate: { path: 'seller', select: 'pseudo lightningAddress' },
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des favoris.', error: error.message });
  }
};