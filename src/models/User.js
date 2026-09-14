const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'adresse email est requise"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Veuillez fournir une adresse email valide"],
    },
    pseudo: {
      type: String,
      required: [true, "Le pseudo est requis"],
      trim: true,
      minlength: [3, "Le pseudo doit contenir au moins 3 caractères"],
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
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
      },
    ],
  },
  {
    timestamps: true, // Génère automatiquement createdAt et updatedAt
  }
);

module.exports = mongoose.model('User', userSchema);