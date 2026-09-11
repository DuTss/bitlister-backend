const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');

dotenv.config();

// Connexion BDD
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Déclaration des routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API BitLister opérationnelle (CommonJS)' });
});

app.listen(PORT, () => {
  console.log(`⚡️ Serveur BitLister démarré sur http://localhost:${PORT}`);
});