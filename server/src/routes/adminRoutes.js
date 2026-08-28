const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GameRound = require('../models/GameRound');
const Bet = require('../models/Bet');
const adminAuth = require('../middleware/adminAuth');
const {
  getCurrentGame,
  adminInstantCrash,
  adminScheduleCrash,
  getScheduledCrashes,
  removeScheduledCrash
} = require('../game/gameEngine');

// Apply admin auth to all routes in this file
router.use(adminAuth);

// Helper to get socket io from app
function getIo(req) {
  return req.app.get('io');
}

// ==================== DASHBOARD STATS ====================
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingDeposits = await Transaction.countDocuments({ type: 'deposit', status: 'pending' });
    const pendingWithdrawals = await Transaction.countDocuments({ type: 'withdraw', status: 'pending' });
    
    const approvedDeposits = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDepositAmount = approvedDeposits[0]?.total || 0;

    const approvedWithdrawals = await Transaction.aggregate([
      { $match: { type: 'withdraw', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawAmount = approvedWithdrawals[0]?.total || 0;

    const totalRounds = await GameRound.countDocuments();
    const currentGame = getCurrentGame();

    res.json({
      totalUsers,
      pendingDeposits,
      pendingWithdrawals,
      totalDepositAmount,
      totalWithdrawAmount,
      totalRounds,
      currentGameStatus: currentGame.status,
      currentMultiplier: parseFloat(currentGame.multiplier.toFixed(2))
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// ==================== USER MANAGEMENT ====================
// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/users/:id/ban - Instant Realtime Ban
router.put('/users/:id/ban', async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role === 'admin' || target.username === 'Noman') {
      return res.status(400).json({ message: 'Cannot ban Administrator accounts.' });
    }

    const { isBanned = true, banUntil = null, banMessage = 'Your account has been restricted by the administrator.' } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isBanned: true,
        banUntil: banUntil ? new Date(banUntil) : null,
        banMessage
      },
      { new: true }
    );

    // Emit instant real-time ban notification to user's screen
    const io = getIo(req);
    if (io) {
      io.to(`user:${user._id}`).emit('user:banned', {
        isBanned: true,
        banUntil: user.banUntil,
        banMessage: user.banMessage
      });
    }

    res.json({ message: 'User banned and locked out in real-time.', user });
  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ message: 'Server error banning user' });
  }
});

// PUT /api/admin/users/:id/unban - Instant Realtime Unban
router.put('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, banUntil: null, banMessage: '' },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Emit instant real-time unban to unlock user screen
    const io = getIo(req);
    if (io) {
      io.to(`user:${user._id}`).emit('user:unbanned', {
        isBanned: false
      });
    }

    res.json({ message: 'User unbanned successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error unbanning user' });
  }
});

// PUT /api/admin/users/:id/balance
router.put('/users/:id/balance', async (req, res) => {
  try {
    const { amount, type = 'add' } = req.body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const adjustment = type === 'deduct' ? -numAmount : numAmount;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.balance = Math.max(0, (user.balance || 0) + adjustment);
    await user.save();

    // Notify user of balance update live
    const io = getIo(req);
    if (io) {
      io.to(`user:${user._id}`).emit('balance:updated', { balance: user.balance });
    }

    res.json({ message: `Balance ${type === 'deduct' ? 'deducted' : 'added'} successfully`, balance: user.balance, user });
  } catch (err) {
    console.error('Adjust balance error:', err);
    res.status(500).json({ message: 'Server error adjusting balance' });
  }
});

// POST /api/admin/users/:id/notify
router.post('/users/:id/notify', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Notification message cannot be empty' });
    }

    const newNotification = {
      message: message.trim(),
      read: false,
      createdAt: new Date().toISOString()
    };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          notifications: newNotification
        }
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Live socket push notification
    const io = getIo(req);
    if (io) {
      io.to(`user:${user._id}`).emit('notification:new', newNotification);
    }

    res.json({ message: 'Notification sent successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error sending notification' });
  }
});

// ==================== TRANSACTION MANAGEMENT ====================
// GET /api/admin/transactions
router.get('/transactions', async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('userId', 'username idNumber firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Admin transactions error:', err);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

// PUT /api/admin/transactions/:id/approve
router.put('/transactions/:id/approve', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: `Transaction is already ${transaction.status}` });
    }

    const io = getIo(req);

    // For deposits: credit user balance
    if (transaction.type === 'deposit') {
      const updatedUser = await User.findByIdAndUpdate(
        transaction.userId,
        {
          $inc: { balance: transaction.amount },
          $push: {
            notifications: {
              message: `✅ Your deposit of PKR ${transaction.amount.toLocaleString()} has been approved!`,
              read: false,
              createdAt: new Date().toISOString()
            }
          }
        },
        { new: true }
      );

      if (io && updatedUser) {
        io.to(`user:${transaction.userId}`).emit('balance:updated', { balance: updatedUser.balance });
        io.to(`user:${transaction.userId}`).emit('notification:new', {
          message: `✅ Your deposit of PKR ${transaction.amount.toLocaleString()} has been approved!`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    } else if (transaction.type === 'withdraw') {
      await User.findByIdAndUpdate(
        transaction.userId,
        {
          $push: {
            notifications: {
              message: `💸 Your withdrawal of PKR ${transaction.amount.toLocaleString()} has been processed and sent!`,
              read: false,
              createdAt: new Date().toISOString()
            }
          }
        }
      );

      if (io) {
        io.to(`user:${transaction.userId}`).emit('notification:new', {
          message: `💸 Your withdrawal of PKR ${transaction.amount.toLocaleString()} has been processed and sent!`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    transaction.status = 'approved';
    transaction.processedAt = new Date().toISOString();
    await transaction.save();

    res.json({ message: `Transaction approved successfully`, transaction });
  } catch (err) {
    console.error('Approve transaction error:', err);
    res.status(500).json({ message: 'Server error approving transaction' });
  }
});

// PUT /api/admin/transactions/:id/reject
router.put('/transactions/:id/reject', async (req, res) => {
  try {
    const { adminNote } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: `Transaction is already ${transaction.status}` });
    }

    const io = getIo(req);

    // For withdrawals: refund user balance
    if (transaction.type === 'withdraw') {
      const updatedUser = await User.findByIdAndUpdate(
        transaction.userId,
        {
          $inc: { balance: transaction.amount },
          $push: {
            notifications: {
              message: `❌ Withdrawal of PKR ${transaction.amount.toLocaleString()} was rejected (${adminNote || 'Contact support'}). Refunded to your balance.`,
              read: false,
              createdAt: new Date().toISOString()
            }
          }
        },
        { new: true }
      );

      if (io && updatedUser) {
        io.to(`user:${transaction.userId}`).emit('balance:updated', { balance: updatedUser.balance });
      }
    } else if (transaction.type === 'deposit') {
      await User.findByIdAndUpdate(
        transaction.userId,
        {
          $push: {
            notifications: {
              message: `❌ Deposit of PKR ${transaction.amount.toLocaleString()} was rejected: ${adminNote || 'Invalid screenshot/transaction ID'}.`,
              read: false,
              createdAt: new Date().toISOString()
            }
          }
        }
      );
    }

    transaction.status = 'rejected';
    transaction.adminNote = adminNote || 'Rejected by administrator';
    transaction.processedAt = new Date().toISOString();
    await transaction.save();

    res.json({ message: 'Transaction rejected successfully', transaction });
  } catch (err) {
    console.error('Reject transaction error:', err);
    res.status(500).json({ message: 'Server error rejecting transaction' });
  }
});

// ==================== GAME CONTROL ====================
// GET /api/admin/game/current
router.get('/game/current', (req, res) => {
  try {
    const game = getCurrentGame();
    res.json({
      roundId: game.roundId,
      status: game.status,
      multiplier: parseFloat(game.multiplier.toFixed(2)),
      crashPoint: game.crashPoint,
      serverSeedHash: game.serverSeedHash,
      countdownEnd: game.countdownEnd,
      activeBetsCount: game.activeBets.size
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/game/instant-crash
router.post('/game/instant-crash', (req, res) => {
  try {
    const { multiplier } = req.body;
    const mult = parseFloat(multiplier);
    if (isNaN(mult) || mult < 1.00) {
      return res.status(400).json({ message: 'Multiplier must be >= 1.00' });
    }

    adminInstantCrash(mult);
    res.json({ message: `Instant crash scheduled at ${mult.toFixed(2)}x for next round!` });
  } catch (err) {
    res.status(500).json({ message: 'Error scheduling instant crash' });
  }
});

// POST /api/admin/game/schedule-crash
router.post('/game/schedule-crash', (req, res) => {
  try {
    const { multiplier, triggerAt } = req.body;
    const mult = parseFloat(multiplier);

    if (isNaN(mult) || mult < 1.00) {
      return res.status(400).json({ message: 'Multiplier must be >= 1.00' });
    }

    if (!triggerAt) {
      return res.status(400).json({ message: 'Trigger time is required' });
    }

    adminScheduleCrash(mult, triggerAt);
    res.json({
      message: `Crash scheduled at ${mult.toFixed(2)}x for ${new Date(triggerAt).toLocaleString()}`,
      scheduledCrashes: getScheduledCrashes()
    });
  } catch (err) {
    res.status(500).json({ message: 'Error scheduling crash' });
  }
});

// GET /api/admin/game/scheduled
router.get('/game/scheduled', (req, res) => {
  try {
    res.json(getScheduledCrashes());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/game/scheduled/:id
router.delete('/game/scheduled/:id', (req, res) => {
  try {
    removeScheduledCrash(req.params.id);
    res.json({ message: 'Scheduled crash removed', scheduledCrashes: getScheduledCrashes() });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/game/history
router.get('/game/history', async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const total = await GameRound.countDocuments();
    const rounds = await GameRound.find()
      .sort({ roundId: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ rounds, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching game history' });
  }
});

module.exports = router;
