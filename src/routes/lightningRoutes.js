const express = require('express');
const router = express.Router();
const { createInvoice, checkInvoiceStatus } = require('../controllers/lightningController');

router.get('/create-invoice', createInvoice);
router.get('/check-invoice/:paymentHash', checkInvoiceStatus);

module.exports = router;