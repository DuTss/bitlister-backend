const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const userRoutes = require('./routes/userRoutes');
const meetupRoutes = require('./routes/meetupRoutes');
const lightningRoutes = require('./routes/lightningRoutes');

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API BitLister opérationnelle (CommonJS)' });
});

// 3. Création du serveur HTTP enveloppant Express
const server = http.createServer(app);

// 4. Initialisation de Socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200', // URL d'Angular en dev
    methods: ['GET', 'POST']
  }
});

// 5. Gestion des événements WebSocket (Chiffrement E2EE P2P)
io.on('connection', (socket) => {
  console.log(`🔌 Utilisateur connecté au WebSocket : ${socket.id}`);

  // Rejoindre un canal de discussion dédié
  socket.on('join_chat', (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`👤 Socket ${socket.id} a rejoint le canal : ${chatRoomId}`);
  });

  // Relayer le message chiffré vers l'autre utilisateur
  socket.on('send_message', (data) => {
    // data contient : { chatRoomId, senderId, encryptedContent, timestamp }
    io.to(data.chatRoomId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
  });
});

// 6. Démarrer le serveur HTTP (au lieu de app.listen)
server.listen(PORT, () => {
  console.log(`⚡️ Serveur BitLister et WebSockets démarrés sur http://localhost:${PORT}`);
});