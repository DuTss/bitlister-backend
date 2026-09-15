const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../config/mailer');

// Inscription
exports.register = async (req, res) => {
  try {
    const { email, pseudo, password, lightningAddress } = req.body;

    // 1. Vérifier si les champs obligatoires sont fournis
    if (!email || !pseudo || !password) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires (email, pseudo, mot de passe)' });
    }

    // 2. Vérifier si l'email est déjà utilisé
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // 3. Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Générer le token de vérification (valable 24h)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 5. Créer l'utilisateur (isVerified vaut false par défaut via le Schema)
    const user = await User.create({
      email: email.toLowerCase(),
      pseudo: pseudo.trim(),
      password: hashedPassword,
      lightningAddress: lightningAddress ? lightningAddress.trim() : '',
      favorites: [],
      emailVerificationToken: verificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 heures
    });

    // 6. Envoyer le mail de confirmation
    await sendVerificationEmail(user.email, verificationToken);

    // 7. Réponse sans jeton JWT (la connexion se fera après validation de l'email)
    res.status(201).json({
      message: 'Compte créé avec succès. Un e-mail de confirmation vous a été envoyé pour activer votre compte.'
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription", error: error.message });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe' });
    }

    // 1. Chercher l'utilisateur par son email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'E-mail ou mot de passe incorrect' });
    }

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'E-mail ou mot de passe incorrect' });
    }

    // 3. Vérifier si l'utilisateur est vérifié
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Votre compte n\'est pas encore activé. Veuillez vérifier vos e-mails.' 
      });
    }

    // 4. Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, pseudo: user.pseudo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        email: user.email,
        pseudo: user.pseudo,
        lightningAddress: user.lightningAddress,
        favorites: user.favorites || [],
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la connexion', error: error.message });
  }
};