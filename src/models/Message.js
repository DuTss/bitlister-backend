const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatRoomId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  recipientId: { type: String },
  encryptedContent: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);