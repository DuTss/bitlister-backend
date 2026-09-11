const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Inscription
exports.register = async (req, res) => {
  try {
    const { username, password, lightningAddress } = req.body;

    // 1. Vérifier si les champs obligatoires sont fournis
    if (!username || !password) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires' });
    }

    // 2. Vérifier si le pseudo est déjà pris
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
    }

    // 3. Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Créer l'utilisateur
    const user = await User.create({
      username,
      password: hashedPassword,
      lightningAddress: lightningAddress || '',
    });

    // 5. Générer un token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user._id,
        username: user.username,
        lightningAddress: user.lightningAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription', error: error.message });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
    }

    // 1. Chercher l'utilisateur
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    // 3. Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        username: user.username,
        lightningAddress: user.lightningAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la connexion', error: error.message });
  }
};