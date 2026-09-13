const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Récupérer le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    // req.user.id provient du middleware d'authentification JWT
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil.', error: error.message });
  }
};

// Mettre à jour le profil (adresse Lightning, username, mot de passe)
exports.updateProfile = async (req, res) => {
  try {
    const { username, lightningAddress, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // 1. Validation de l'adresse Lightning si fournie
    if (lightningAddress) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(lightningAddress)) {
        return res.status(400).json({ message: 'L\'adresse Lightning doit suivre un format valide (ex: user@domain.com).' });
      }
      user.lightningAddress = lightningAddress.trim();
    }

    // 2. Modification du pseudo (si changé et non vide)
    if (username && username.trim() !== user.username) {
      const existingUser = await User.findOne({ username: username.trim() });
      if (existingUser) {
        return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris.' });
      }
      user.username = username.trim();
    }

    // 3. Modification du mot de passe (optionnelle)
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
    const updatedUser = await User.findById(user._id).select('-password');
    res.json({
      message: 'Profil mis à jour avec succès.',
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.', error: error.message });
  }
};