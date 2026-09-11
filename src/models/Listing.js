const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre de l\'annonce est requis'],
      trim: true,
      maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
    },
    description: {
      type: String,
      required: [true, 'La description est requise'],
    },
    priceInSats: {
      type: Number,
      required: [true, 'Le prix en Satoshis est requis'],
      min: [1, 'Le prix doit être au moins de 1 Satoshi'],
    },
    category: {
      type: String,
      required: [true, 'La catégorie est requise'],
      enum: ['Hardware', 'Livres', 'Informatique', 'Services', 'Divers'],
      default: 'Divers',
    },
    location: {
      type: String,
      required: [true, 'La localisation est requise'],
      trim: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RESERVED', 'SOLD'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Listing', listingSchema);