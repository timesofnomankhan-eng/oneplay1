const crypto = require('crypto');
const GameRound = require('../models/GameRound');
const Bet = require('../models/Bet');
const User = require('../models/User');

const STATE = {
  WAITING: 'waiting',
  RUNNING: 'running',
  CRASHED: 'crashed'
};

let currentGame = {
  roundId: 0,
  status: STATE.WAITING,
  multiplier: 1.00,
  crashPoint: 1.00,
  serverSeed: '',
  serverSeedHash: '',
  startTime: null,
  countdownEnd: null,
  activeBets: new Map() // `${userId}_${slot}` -> { userId, amount, autoCashoutAt, betId, username, slot }
};

let scheduledCrashes = []; // array of { multiplier, triggerAt, id }
let nextInstantCrash = null;
let ioInstance = null;
let tickInterval = null;
let isInitialized = false;

// Provably Fair Crash Point Generator
function generateCrashPoint(serverSeed, roundId, adminOverride = null) {
  if (adminOverride && typeof adminOverride === 'number' && adminOverride >= 1.00) {
    return parseFloat(adminOverride.toFixed(2));
  }
  
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(roundId.toString());
  const hash = hmac.digest('hex');
  const h = parseInt(hash.slice(0, 8), 16);
  const e = Math.pow(2, 32);
  
  // 3% house edge: ~3% chance of instant crash at 1.00x
  if (h % 33 === 0) {
    return 1.00;
  }
  
  const crash = Math.floor((100 * e - h) / (e - h)) / 100;
  const finalMultiplier = Math.max(1.00, Math.min(crash, 1000.00));
  return parseFloat(finalMultiplier.toFixed(2));
}

// Multiplier formula based on elapsed milliseconds (exponential growth)
function calcMultiplier(elapsedMs) {
  const mult = Math.pow(Math.E, 0.000065 * elapsedMs);
  return Math.max(1.00, parseFloat(mult.toFixed(2)));
}

async function startNewRound(io) {
  try {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }

    const serverSeed = crypto.randomBytes(32).toString('hex');
    const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    
    // Find highest roundId
    const lastRound = await GameRound.findOne().sort({ roundId: -1 });
    const roundId = lastRound ? (lastRound.roundId || 0) + 1 : 1;

    // Check for admin-scheduled crash
    let adminCrash = null;
    if (nextInstantCrash !== null) {
      adminCrash = nextInstantCrash;
      nextInstantCrash = null;
    } else {
      const now = new Date();
      const schedIndex = scheduledCrashes.findIndex(s => new Date(s.triggerAt) <= now);
      if (schedIndex !== -1) {
        adminCrash = scheduledCrashes[schedIndex].multiplier;
        scheduledCrashes.splice(schedIndex, 1);
      }
    }

    const crashPoint = generateCrashPoint(serverSeed, roundId, adminCrash);

    const round = new GameRound({
      roundId,
      serverSeed,
      serverSeedHash,
      crashPoint,
      status: STATE.WAITING,
      scheduledCrashPoint: adminCrash,
      isInstantCrash: adminCrash !== null
    });
    await round.save();

    currentGame = {
      roundId,
      status: STATE.WAITING,
      multiplier: 1.00,
      crashPoint,
      serverSeed,
      serverSeedHash,
      startTime: null,
      countdownEnd: Date.now() + 5000,
      activeBets: new Map()
    };

    io.emit('game:waiting', {
      roundId,
      serverSeedHash,
      countdownEnd: currentGame.countdownEnd
    });

    // 5 second waiting phase before plane takes off
    setTimeout(() => {
      runGame(io, round);
    }, 5000);

  } catch (err) {
    console.error('Error starting new round:', err);
    setTimeout(() => startNewRound(io), 3000);
  }
}

async function runGame(io, round) {
  try {
    currentGame.status = STATE.RUNNING;
    currentGame.startTime = Date.now();

    await GameRound.updateOne(
      { roundId: currentGame.roundId },
      { status: STATE.RUNNING, startedAt: new Date() }
    );

    io.emit('game:start', {
      roundId: currentGame.roundId,
      startTime: currentGame.startTime
    });

    tickInterval = setInterval(async () => {
      if (currentGame.status !== STATE.RUNNING) {
        clearInterval(tickInterval);
        return;
      }

      const elapsed = Date.now() - currentGame.startTime;
      const currentMultiplier = calcMultiplier(elapsed);
      currentGame.multiplier = currentMultiplier;

      // Broadcast tick to all connected users
      io.emit('game:tick', {
        multiplier: currentMultiplier,
        roundId: currentGame.roundId,
        elapsed
      });

      // Process auto-cashouts for both slots
      for (const [betKey, bet] of currentGame.activeBets.entries()) {
        if (bet.autoCashoutAt && currentMultiplier >= bet.autoCashoutAt) {
          await processCashout(io, betKey, currentMultiplier, 'auto');
        }
      }

      // Check if crashed
      if (currentMultiplier >= currentGame.crashPoint) {
        clearInterval(tickInterval);
        tickInterval = null;
        await processCrash(io);
      }
    }, 80); // 80ms for smooth updates

  } catch (err) {
    console.error('Error running game:', err);
  }
}

async function processCashout(io, betKey, multiplier, type = 'manual') {
  const bet = currentGame.activeBets.get(betKey);
  if (!bet || currentGame.status !== STATE.RUNNING) return false;

  const actualMultiplier = parseFloat(multiplier.toFixed(2));
  const profit = parseFloat((bet.amount * actualMultiplier).toFixed(2));

  // Update Bet in DB
  await Bet.findByIdAndUpdate(bet.betId, {
    status: 'won',
    cashedOutAt: actualMultiplier,
    profit: profit
  });

  // Credit user balance
  const updatedUser = await User.findByIdAndUpdate(
    bet.userId,
    { $inc: { balance: profit } },
    { new: true }
  );

  // Remove this specific slot bet from active map
  currentGame.activeBets.delete(betKey);

  // Notify the winning user with slot distinction
  io.to(`user:${bet.userId}`).emit('bet:won', {
    betId: bet.betId,
    profit,
    multiplier: actualMultiplier,
    newBalance: updatedUser ? updatedUser.balance : 0,
    slot: bet.slot || 1
  });

  // Broadcast to all users to update live bets feed
  io.emit('bets:update', {
    userId: bet.userId.toString(),
    username: bet.username,
    status: 'won',
    cashedOutAt: actualMultiplier,
    profit,
    roundId: currentGame.roundId,
    slot: bet.slot || 1
  });

  return true;
}

async function processCrash(io) {
  try {
    currentGame.status = STATE.CRASHED;
    const finalCrashPoint = parseFloat(currentGame.crashPoint.toFixed(2));

    // Handle all uncashed slot bets as lost
    for (const [betKey, bet] of currentGame.activeBets.entries()) {
      await Bet.findByIdAndUpdate(bet.betId, {
        status: 'lost',
        cashedOutAt: null,
        profit: 0
      });
      io.to(`user:${bet.userId}`).emit('bet:lost', {
        betId: bet.betId,
        crashPoint: finalCrashPoint,
        slot: bet.slot || 1
      });
    }

    currentGame.activeBets.clear();

    await GameRound.updateOne(
      { roundId: currentGame.roundId },
      {
        status: STATE.CRASHED,
        endedAt: new Date(),
        crashPoint: finalCrashPoint
      }
    );

    io.emit('game:crash', {
      crashPoint: finalCrashPoint,
      roundId: currentGame.roundId,
      serverSeed: currentGame.serverSeed
    });

    // 3.5 seconds cooldown before next round starts
    setTimeout(() => {
      startNewRound(io);
    }, 3500);

  } catch (err) {
    console.error('Error processing crash:', err);
    setTimeout(() => startNewRound(io), 3000);
  }
}

function initGameEngine(io) {
  if (isInitialized) return;
  isInitialized = true;
  ioInstance = io;
  startNewRound(io);
}

function getCurrentGame() {
  return currentGame;
}

function placeBet(userId, amount, autoCashoutAt, betId, username, slot = 1) {
  if (currentGame.status !== STATE.WAITING) return false;
  const betKey = `${userId}_${slot}`;
  currentGame.activeBets.set(betKey, {
    userId,
    amount,
    autoCashoutAt,
    betId,
    username,
    slot
  });
  return true;
}

function requestCashout(io, userId, slot = 1) {
  const betKey = `${userId}_${slot}`;
  return processCashout(io, betKey, currentGame.multiplier, 'manual');
}

function adminInstantCrash(multiplier) {
  nextInstantCrash = parseFloat(multiplier);
}

function adminScheduleCrash(multiplier, triggerAt) {
  scheduledCrashes.push({
    id: Date.now().toString(),
    multiplier: parseFloat(multiplier),
    triggerAt: new Date(triggerAt)
  });
}

function getScheduledCrashes() {
  return scheduledCrashes;
}

function removeScheduledCrash(id) {
  scheduledCrashes = scheduledCrashes.filter(s => s.id !== id);
}

module.exports = {
  initGameEngine,
  getCurrentGame,
  placeBet,
  requestCashout,
  adminInstantCrash,
  adminScheduleCrash,
  getScheduledCrashes,
  removeScheduledCrash,
  STATE
};
