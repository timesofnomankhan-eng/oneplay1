const express = require('express');
const router = express.Router();
const GameRound = require('../models/GameRound');
const Bet = require('../models/Bet');
const auth = require('../middleware/auth');
const { getCurrentGame } = require('../game/gameEngine');

// GET /api/game/history - get recent rounds
router.get('/history', async (req, res) => {
  try {
    const rounds = await GameRound.find({ status: 'crashed' })
      .sort({ roundId: -1 })
      .limit(30)
      .select('roundId crashPoint serverSeedHash endedAt');

    res.json(rounds);
  } catch (err) {
    console.error('Game history error:', err);
    res.status(500).json({ message: 'Server error fetching game history' });
  }
});

// GET /api/game/current - get current round info
router.get('/current', (req, res) => {
  try {
    const game = getCurrentGame();
    res.json({
      roundId: game.roundId,
      status: game.status,
      multiplier: parseFloat(game.multiplier.toFixed(2)),
      serverSeedHash: game.serverSeedHash,
      countdownEnd: game.countdownEnd
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/game/my-bets - user bet history
router.get('/my-bets', auth, async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(bets);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching bet history' });
  }
});

module.exports = router;
