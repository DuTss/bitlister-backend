const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt');

    // On récupère l'ID peu importe le nom utilisé à la création du token
    const userId = decoded._id || decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Token invalide : identifiant utilisateur introuvable.' });
    }

    // On garantit que req.user contient _id et id
    req.user = {
      _id: userId,
      id: userId,
      ...decoded
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré.', error: error.message });
  }
};