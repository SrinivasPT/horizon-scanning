const express = require('express');
const router = express.Router();
const scannerController = require('../controllers/scannerController');

// Start a new scanner job
router.post('/start-scan', scannerController.startScannerJob);

// Complete a scanner job
router.put('/complete-scan', scannerController.completeScannerJob);

// Mark a scanner job as failed
router.put('/scan-failed', scannerController.failScannerJob);

// Get scanner job details
router.get('/:id', scannerController.getScannerJob);

module.exports = router;
