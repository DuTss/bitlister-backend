const express = require('express');
const router = express.Router();
const { getMeetupPointsByCity } = require('../controllers/meetupController');

// Route publique GET /api/meetups?city=Lyon
router.get('/', getMeetupPointsByCity);

module.exports = router;