// backend/src/controllers/lightningController.js

// URL d'un nœud LNbits public de démonstration (ou ton propre serveur LNbits)
const LNBITS_URL = process.env.LNBITS_URL || 'https://legend.lnbits.com';
const LNBITS_READ_KEY = process.env.LNBITS_READ_KEY || ''; // Clé de lecture/écriture LNbits

/**
 * Créer une facture Lightning (Invoice)
 * GET /api/lightning/create-invoice?amount=1000&memo=Achat+BitLister
 */
const createInvoice = async (req, res) => {
  const amount = parseInt(req.query.amount, 10);
  const memo = req.query.memo || 'Transaction BitLister P2P';

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Montant en Satoshis invalide.' });
  }

  try {
    const response = await fetch(`${LNBITS_URL}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': LNBITS_READ_KEY
      },
      body: JSON.stringify({
        out: false,
        amount: amount,
        memo: memo
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur serveur LNbits: ${response.status}`);
    }

    const data = await response.json();
    // data contient : { payment_hash, payment_request, checking_id }
    return res.json({
      paymentHash: data.payment_hash,
      paymentRequest: data.payment_request,
      checkingId: data.checking_id
    });
  } catch (error) {
    console.error('Erreur lors de la création de la facture LN :', error.message);
    // Fallback de démonstration si pas de nœud configuré
    return res.json({
      paymentHash: 'demo_hash_' + Date.now(),
      paymentRequest: `lnbc${amount}n1pdemo...`,
      checkingId: 'demo_check_' + Date.now()
    });
  }
};

/**
 * Vérifier l'état de paiement d'une facture
 * GET /api/lightning/check-invoice/:paymentHash
 */
const checkInvoiceStatus = async (req, res) => {
  const { paymentHash } = req.params;

  if (!paymentHash) {
    return res.status(400).json({ message: 'Hash de paiement manquant.' });
  }

  try {
    const response = await fetch(`${LNBITS_URL}/api/v1/payments/${paymentHash}`, {
      headers: {
        'X-Api-Key': LNBITS_READ_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur statut LNbits: ${response.status}`);
    }

    const data = await response.json();
    return res.json({ paid: data.paid || false });
  } catch (error) {
    return res.json({ paid: false });
  }
};

module.exports = {
  createInvoice,
  checkInvoiceStatus
};