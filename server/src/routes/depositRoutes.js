const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const SiteSettings = require('../models/SiteSettings');
const auth = require('../middleware/auth');
const { uploadScreenshot } = require('../middleware/upload');

// POST /api/deposit/request
router.post('/request', auth, uploadScreenshot, async (req, res) => {
  try {
    const { amount, method, transactionId, phoneNumber } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid deposit amount is required' });
    }

    if (!method || !['easypaisa', 'jazzcash', 'bank'].includes(method)) {
      return res.status(400).json({ message: 'Valid payment method is required (easypaisa, jazzcash, bank)' });
    }

    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const settings = await SiteSettings.getSingleton();
    if (parseFloat(amount) < (settings.minDeposit || 100)) {
      return res.status(400).json({ message: `Minimum deposit amount is PKR ${settings.minDeposit || 100}` });
    }

    if (parseFloat(amount) > (settings.maxDeposit || 100000)) {
      return res.status(400).json({ message: `Maximum deposit amount is PKR ${settings.maxDeposit || 100000}` });
    }

    const screenshotPath = req.file ? `/uploads/${req.file.filename}` : '';

    const transaction = new Transaction({
      userId: req.user._id,
      type: 'deposit',
      amount: parseFloat(amount),
      method,
      transactionId: transactionId.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      screenshotPath,
      status: 'pending'
    });

    await transaction.save();

    res.status(201).json({
      message: 'Deposit request submitted successfully! Admin will verify and approve shortly.',
      transaction
    });

  } catch (err) {
    console.error('Deposit request error:', err);
    res.status(500).json({ message: 'Server error processing deposit request' });
  }
});

// GET /api/deposit/my
router.get('/my', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
      type: 'deposit'
    }).sort({ createdAt: -1 }).limit(50);

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching deposit history' });
  }
});

module.exports = router;
