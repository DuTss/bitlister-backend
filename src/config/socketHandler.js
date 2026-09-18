const Message = require('../models/Message');

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Utilisateur connecté au WebSocket : ${socket.id}`);

    // Rejoindre un canal de discussion dédié
    socket.on('joinRoom', (chatRoomId) => {
      socket.join(chatRoomId);
      console.log(`👤 Socket ${socket.id} a rejoint le canal : ${chatRoomId}`);
    });

    // Échanger la clé publique
    socket.on('share_public_key', (data) => {
      socket.to(data.chatRoomId).emit('receive_public_key', data);
    });

    // Demande de clé publique
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
}

module.exports = initSocket;