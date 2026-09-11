const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const auth = require('../middlewares/auth');

// Routes publiques
router.get('/', listingController.getAllListings);
router.get('/:id', listingController.getListingById);

// Routes privées (nécessitent un token JWT)
router.post('/', auth, listingController.createListing);
router.delete('/:id', auth, listingController.deleteListing);

module.exports = router;