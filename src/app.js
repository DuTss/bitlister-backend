const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Connexion à la base de données
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API BitLister opérationnelle' });
});

app.listen(PORT, () => {
  console.log(`⚡️ Serveur BitLister démarré sur http://localhost:${PORT}`);
});