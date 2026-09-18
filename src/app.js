const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Import du gestionnaire Socket.io
const initSocket = require('./config/socketHandler');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const userRoutes = require('./routes/userRoutes');
const meetupRoutes = require('./routes/meetupRoutes');
const lightningRoutes = require('./routes/lightningRoutes');
const chatRoutes = require('./routes/chatRoutes');

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
app.use('/api/users', userRoutes);
app.use('/api/meetups', meetupRoutes);
app.use('/api/lightning', lightningRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API BitLister opérationnelle (CommonJS)' });
});

// Création du serveur HTTP
const server = http.createServer(app);

// Initialisation de Socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200', // URL d'Angular en dev
    methods: ['GET', 'POST']
  }
});

// Attacher tous les événements sockets
initSocket(io);

// Démarrer le serveur HTTP
server.listen(PORT, () => {
  console.log(`⚡️ Serveur BitLister et WebSockets démarrés sur http://localhost:${PORT}`);
});