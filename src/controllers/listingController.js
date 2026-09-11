const Listing = require('../models/Listing');

// 1. Récupérer toutes les annonces (avec filtre optionnel)
exports.getAllListings = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { status: 'ACTIVE' }; // On affiche uniquement les annonces actives

    if (category) {
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
      .populate('seller', 'username lightningAddress') // Inclut le pseudo et l'adresse Lightning du vendeur
      .sort({ createdAt: -1 }); // Les plus récentes en premier

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des annonces', error: error.message });
  }
};

// 2. Récupérer une seule annonce par son ID
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'username lightningAddress');

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
    await listing.populate('seller', 'username lightningAddress');

    res.status(201).json({
      message: 'Annonce publiée avec succès',
      listing,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'annonce', error: error.message });
  }
};

// 4. Supprimer une annonce (Protégé)
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Annonce introuvable' });
    }

    // Vérifier si l'utilisateur connecté est bien le propriétaire de l'annonce
    if (listing.seller.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Action non autorisée : Vous n\'êtes pas le propriétaire' });
    }

    await listing.deleteOne();
    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
};