const Listing = require('../models/Listing');

// 1. Récupérer toutes les annonces (avec filtre optionnel)
exports.getAllListings = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { status: 'ACTIVE' }; // On affiche uniquement les annonces actives

    // Seule modification : vérifier que category n'est pas vide ni égal à 'Toutes'
    if (category && category !== 'Toutes') {
      query.category = category;
    }

    if (search) {
      // Recherche insensible à la casse dans le titre ou la description
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const listings = await Listing.find(query)
      .populate('seller', 'pseudo lightningAddress')
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des annonces', error: error.message });
  }
};

// 2. Récupérer une seule annonce par son ID
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'pseudo lightningAddress');

    if (!listing) {
      return res.status(404).json({ message: 'Annonce introuvable' });
    }

    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// 3. Créer une nouvelle annonce (Protégé)
exports.createListing = async (req, res) => {
  try {
    const { title, description, priceInSats, category, location } = req.body;

    if (!title || !description || !priceInSats || !location) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires' });
    }

    const listing = await Listing.create({
      title,
      description,
      priceInSats,
      category: category || 'Divers',
      location,
      seller: req.user.userId, // Provient du token vérifié par le middleware auth
    });

    // Populate les infos du vendeur pour le retour JSON
    await listing.populate('seller', 'pseudo lightningAddress');

    res.status(201).json({
      message: 'Annonce publiée avec succès',
      listing,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'annonce', error: error.message });
  }
};

// 4.Récupérer uniquement les annonces du vendeur connecté
exports.getMyListings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const listings = await Listing.find({ seller: userId }).sort({ createdAt: -1 });
    
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de vos annonces.', error: error.message });
  }
};

// 5.Changer le statut d'une annonce (ACTIVE, SOLD, ARCHIVED)
exports.updateListingStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'SOLD', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    // Vérification de propriété
    if (listing.seller.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Action non autorisée sur cette annonce.' });
    }

    listing.status = status;
    await listing.save();

    res.json({ message: 'Statut mis à jour avec succès.', listing });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut.', error: error.message });
  }
};

// 6. Supprimer une annonce (Protégé)
exports.deleteListing = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    // Vérification de propriété
    if (listing.seller.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Action non autorisée sur cette annonce.' });
    }

    await Listing.findByIdAndDelete(id);

    res.json({ message: 'Annonce supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'annonce.', error: error.message });
  }
};

// 7. Mettre à jour une annonce (Protégé)
exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Annonce introuvable' });
    }

    // Vérifier si l'utilisateur connecté est bien le propriétaire de l'annonce
    if (listing.seller.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Action non autorisée : Vous n\'êtes pas le propriétaire' });
    }

    const { title, description, priceInSats, category, location } = req.body;

    Object.assign(listing, { title, description, priceInSats, category, location });

    await listing.save();

    await listing.populate('seller', 'pseudo lightningAddress');

    res.json({
      message: 'Annonce mise à jour avec succès',
      listing,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error: error.message });
  }
};
