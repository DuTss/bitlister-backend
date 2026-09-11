const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Le nom d\'utilisateur est requis'],
      unique: true,
      trim: true,
      minlength: [3, 'Le pseudo doit contenir au moins 3 caractères'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    },
    lightningAddress: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true, // Génère automatiquement createdAt et updatedAt
  }
);

module.exports = mongoose.model('User', userSchema);