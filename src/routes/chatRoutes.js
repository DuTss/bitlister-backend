const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Récupérer tous les messages chiffrés d'une room
router.get('/:roomId', async (req, res) => {
  try {
    const messages = await Message.find({ chatRoomId: req.params.roomId })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des messages.' });
  }
});

// Récupérer la liste des salons/conversations d'un utilisateur
router.get('/user/:userId/conversations', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Trouve toutes les rooms uniques où l'utilisateur a envoyé ou reçu un message
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { recipientId: userId }]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$chatRoomId',
        //   lastMessage: { $first: '$encryptedContent' },
          lastTimestamp: { $first: '$timestamp' },
          senderId: { $first: '$senderId' },
          recipientId: { $first: '$recipientId' },
          lastEncryptedForRecipient: { $first: '$encryptedForRecipient' },
          lastEncryptedForSender: { $first: '$encryptedForSender' },
        }
      },
      {
        $sort: { lastTimestamp: -1 }
      }
    ]);

    res.json(conversations);
  } catch (err) {
    console.error('Erreur lors de la récupération des conversations :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;