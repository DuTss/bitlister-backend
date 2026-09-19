const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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

// Récupérer la liste des salons/conversations d'un utilisateur avec le pseudo du destinataire
router.get('/user/:userId/conversations', async (req, res) => {
  try {
    const userId = req.params.userId;

    const conversations = await Message.aggregate([
      // 1. Filtrer les messages où l'utilisateur courant est expéditeur ou destinataire
      {
        $match: {
          $or: [{ senderId: userId }, { recipientId: userId }]
        }
      },
      // 2. Trier du plus récent au plus ancien
      {
        $sort: { timestamp: -1 }
      },
      // 3. Regrouper par salon de discussion (chatRoomId)
      {
        $group: {
          _id: '$chatRoomId',
          lastTimestamp: { $first: '$timestamp' },
          senderId: { $first: '$senderId' },
          recipientId: { $first: '$recipientId' },
          lastEncryptedForRecipient: { $first: '$encryptedForRecipient' },
          lastEncryptedForSender: { $first: '$encryptedForSender' }
        }
      },
      // 4. Déterminer l'ID de l'interlocuteur (l'autre utilisateur)
      {
        $addFields: {
          otherUserIdString: {
            $cond: {
              if: { $eq: ['$senderId', userId] },
              then: '$recipientId',
              else: '$senderId'
            }
          }
        }
      },
      // 5. Convertir la chaîne "otherUserIdString" en ObjectId pour pouvoir effectuer le $lookup
      {
        $addFields: {
          otherUserIdObj: {
            $cond: {
              if: { $and: [{ $ne: ['$otherUserIdString', ''] }, { $ne: ['$otherUserIdString', null] }] },
              then: { $toObjectId: '$otherUserIdString' },
              else: null
            }
          }
        }
      },
      // 6. Jointure avec la collection 'users'
      {
        $lookup: {
          from: 'users',
          localField: 'otherUserIdObj',
          foreignField: '_id',
          as: 'otherUserData'
        }
      },
      // 7. Extraire les données de l'utilisateur (si trouvé)
      {
        $addFields: {
          otherUser: { $arrayElemAt: ['$otherUserData', 0] }
        }
      },
      // 8. Ne conserver que les informations publiques nécessaires (pseudo, _id)
      {
        $project: {
          _id: 1,
          lastTimestamp: 1,
          senderId: 1,
          recipientId: 1,
          lastEncryptedForRecipient: 1,
          lastEncryptedForSender: 1,
          otherUser: {
            _id: '$otherUser._id',
            pseudo: '$otherUser.pseudo'
          }
        }
      },
      // 9. Trier la liste finale par date du dernier message
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