const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Bet = require('../models/Bet');
const { getCurrentGame, placeBet, requestCashout, STATE } = require('../game/gameEngine');

function setupSocketHandler(io) {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        socket.user = null;
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      socket.user = user;
      next();
    } catch (err) {
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    // If authenticated, join user-specific room
    if (socket.user) {
      socket.join(`user:${socket.user._id}`);
    }

    // Send current game state immediately to newly connected client
    const game = getCurrentGame();
    socket.emit('game:state', {
      roundId: game.roundId,
      status: game.status,
      multiplier: parseFloat(game.multiplier.toFixed(2)),
      serverSeedHash: game.serverSeedHash,
      countdownEnd: game.countdownEnd,
      startTime: game.startTime
    });

    // Handle token refresh / re-authentication on existing socket
    socket.on('auth:authenticate', async (data) => {
      try {
        if (!data?.token) return;
        const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          socket.user = user;
          socket.join(`user:${user._id}`);
          socket.emit('auth:success', { userId: user._id });
        }
      } catch (e) {
        socket.emit('auth:error', { message: 'Invalid token' });
      }
    });

    // Handle bet placement for Slot 1 or Slot 2
    socket.on('bet:place', async (data) => {
      try {
        if (!socket.user) {
          return socket.emit('bet:error', { message: 'Please login to place a bet' });
        }

        const user = await User.findById(socket.user._id);
        if (!user) {
          return socket.emit('bet:error', { message: 'User not found' });
        }

        if (user.isCurrentlyBanned()) {
          return socket.emit('bet:error', { 
            message: user.banMessage || 'Your account is banned from betting.' 
          });
        }

        const amount = parseFloat(data.amount);
        const autoCashoutAt = data.autoCashoutAt ? parseFloat(data.autoCashoutAt) : null;
        const slot = Number(data.slot) || 1;

        if (isNaN(amount) || amount <= 0) {
          return socket.emit('bet:error', { message: 'Invalid bet amount' });
        }

        if (user.balance < amount) {
          return socket.emit('bet:error', { message: 'Insufficient balance' });
        }

        const game = getCurrentGame();
        if (game.status !== STATE.WAITING) {
          return socket.emit('bet:error', { message: 'Betting is closed for this round' });
        }

        const betKey = `${user._id}_${slot}`;
        if (game.activeBets.has(betKey)) {
          return socket.emit('bet:error', { message: `Bet already placed in Slot ${slot}` });
        }

        // Deduct balance from DB
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          { $inc: { balance: -amount } },
          { new: true }
        );

        // Create Bet record
        const bet = await Bet.create({
          userId: user._id,
          roundId: game.roundId,
          amount,
          autoCashoutAt: autoCashoutAt && autoCashoutAt > 1.00 ? autoCashoutAt : null,
          status: 'active'
        });

        // Register in game engine with specific slot
        placeBet(
          user._id,
          amount,
          autoCashoutAt && autoCashoutAt > 1.00 ? autoCashoutAt : null,
          bet._id,
          user.username,
          slot
        );

        // Confirm to user
        socket.emit('bet:placed', {
          betId: bet._id,
          amount,
          autoCashoutAt,
          newBalance: updatedUser.balance,
          slot
        });

        // Broadcast to all clients for live bets table
        io.emit('bets:new', {
          userId: user._id,
          username: user.username,
          amount,
          roundId: game.roundId,
          slot
        });

      } catch (err) {
        console.error('Socket bet:place error:', err);
        socket.emit('bet:error', { message: 'Failed to place bet' });
      }
    });

    // Handle manual cashout for Slot 1 or Slot 2
    socket.on('bet:cashout', async (data) => {
      try {
        if (!socket.user) {
          return socket.emit('cashout:error', { message: 'Authentication required' });
        }

        const game = getCurrentGame();
        if (game.status !== STATE.RUNNING) {
          return socket.emit('cashout:error', { message: 'Game is not running' });
        }

        const slot = Number(data?.slot) || 1;
        const success = await requestCashout(io, socket.user._id, slot);
        if (!success) {
          socket.emit('cashout:error', { message: `Cashout failed for Slot ${slot} or already cashed out` });
        }
      } catch (err) {
        console.error('Socket bet:cashout error:', err);
        socket.emit('cashout:error', { message: 'Error processing cashout' });
      }
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = { setupSocketHandler };
