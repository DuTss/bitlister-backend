const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Déclaration modèle de l'API
const Message = require('./models/Message');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const userRoutes = require('./routes/userRoutes');
const meetupRoutes = require('./routes/meetupRoutes');
const lightningRoutes = require('./routes/lightningRoutes');
const chatRoutes = require('./routes/chatRoutes')

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

  // Rejoindre un canal de discussion dédié
  socket.on('joinRoom', (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`👤 Socket ${socket.id} a rejoint le canal : ${chatRoomId}`);
  });

  socket.on('share_public_key', (data) => {
    // Relayer la clé publique aux autres membres du canal
    socket.to(data.chatRoomId).emit('receive_public_key', data);
  });

  // Quand un utilisateur demande la clé publique des membres de la room
  socket.on('request_public_key', (data) => {
    socket.to(data.chatRoomId).emit('public_key_requested', data);
  });

  // Enregistrer puis relayer le message chiffré
socket.on('sendMessage', async (data) => {
  try {
    const { chatRoomId, senderId, recipientId, encryptedForRecipient, encryptedForSender, timestamp } = data;

    // 1. Sauvegarde dans MongoDB avec les 2 champs chiffrés
    const newMessage = new Message({
      chatRoomId,
      senderId,
      recipientId,
      encryptedForRecipient,
      encryptedForSender,
      timestamp: timestamp || new Date()
    });

    await newMessage.save();

    // 2. Émission en temps réel aux autres membres de la room
    io.to(chatRoomId).emit('receiveMessage', data);
  } catch (error) {
    console.error('Erreur sauvegarde message socket :', error);
  }
});

  socket.on('disconnect', () => {
    console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
  });
});

// 6. Démarrer le serveur HTTP (au lieu de app.listen)
server.listen(PORT, () => {
  console.log(`⚡️ Serveur BitLister et WebSockets démarrés sur http://localhost:${PORT}`);
});