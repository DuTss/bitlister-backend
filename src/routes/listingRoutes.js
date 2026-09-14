const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const auth = require('../middlewares/auth');

// Route spécifique en premier
router.get('/mine', auth, listingController.getMyListings);

// Routes publiques
router.get('/', listingController.getAllListings);
router.get('/:id', listingController.getListingById);

// Routes privées (nécessitent un token JWT)
router.post('/', auth, listingController.createListing);
router.put('/:id', auth, listingController.updateListing);
router.patch('/:id/status', auth, listingController.updateListingStatus);
router.delete('/:id', auth, listingController.deleteListing);

module.exports = router;