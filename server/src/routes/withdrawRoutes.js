const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const SiteSettings = require('../models/SiteSettings');
const auth = require('../middleware/auth');

// POST /api/withdraw/request
router.post('/request', auth, async (req, res) => {
  try {
    const { amount, method, accountNumber, phoneNumber } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid withdrawal amount is required' });
    }

    if (!method || !['easypaisa', 'jazzcash', 'bank'].includes(method)) {
      return res.status(400).json({ message: 'Valid withdrawal method is required' });
    }

    if (!accountNumber || !accountNumber.trim()) {
      return res.status(400).json({ message: 'Account number / phone number is required' });
    }

    const settings = await SiteSettings.getSingleton();
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount < (settings.minWithdraw || 200)) {
      return res.status(400).json({ message: `Minimum withdrawal is PKR ${settings.minWithdraw || 200}` });
    }

    if (withdrawAmount > (settings.maxWithdraw || 50000)) {
      return res.status(400).json({ message: `Maximum withdrawal is PKR ${settings.maxWithdraw || 50000}` });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.balance < withdrawAmount) {
      return res.status(400).json({ message: 'Insufficient balance for this withdrawal' });
    }

    // Deduct balance immediately (held in escrow until approved/rejected)
    user.balance -= withdrawAmount;
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      type: 'withdraw',
      amount: withdrawAmount,
      method,
      accountNumber: accountNumber.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : accountNumber.trim(),
      status: 'pending'
    });

    await transaction.save();

    res.status(201).json({
      message: 'Withdrawal request submitted! Admin will process your transfer.',
      transaction,
      newBalance: user.balance
    });

  } catch (err) {
    console.error('Withdraw request error:', err);
    res.status(500).json({ message: 'Server error processing withdrawal' });
  }
});

// GET /api/withdraw/my
router.get('/my', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
      type: 'withdraw'
    }).sort({ createdAt: -1 }).limit(50);

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching withdrawal history' });
  }
});

module.exports = router;
