const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Récupérer le token dans le header "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès refusé : Aucun token fourni' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Vérifier la validité du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Injecte les infos de l'utilisateur ({ userId, username }) dans la requête
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

module.exports = auth;