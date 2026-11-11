const express = require('express');
const router = express.Router();
const ctrl = require('../controller/quoteRequestController');
const { protect, adminOnly } = require('../middleware/AuthVerifyMiddleWare');

// PUBLIC — customer-facing form
router.post('/request-quote', ctrl.createQuoteRequest);

// ADMIN — dashboard
router.get('/quotes/stats/summary', protect, adminOnly, ctrl.getQuoteStats);
router.get('/quotes',               protect, adminOnly, ctrl.getAllQuoteRequests);
router.get('/quotes/:id',           protect, adminOnly, ctrl.getQuoteRequestById);
router.put('/quotes/:id',           protect, adminOnly, ctrl.updateQuoteRequest);
router.delete('/quotes/:id',        protect, adminOnly, ctrl.deleteQuoteRequest);

module.exports = router;