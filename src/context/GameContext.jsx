import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import socket from '../socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import api from '../api';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const { user, updateBalance } = useAuth();

  // Core Game State
  const [gameStatus, setGameStatus] = useState('waiting'); // 'waiting' | 'running' | 'crashed'
  const [multiplier, setMultiplier] = useState(1.00);
  const [roundId, setRoundId] = useState(0);
  const [crashPoint, setCrashPoint] = useState(null);
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [countdownEnd, setCountdownEnd] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(5);

  // User Bets State (Supports Slot 1 & Slot 2)
  const [bets, setBets] = useState({
    1: { amount: 100, autoCashoutAt: '', active: false, won: false, lost: false, profit: 0, betId: null, cashedOutAt: null },
    2: { amount: 100, autoCashoutAt: '', active: false, won: false, lost: false, profit: 0, betId: null, cashedOutAt: null }
  });

  // Multiplayer Live Bets & History
  const [liveBets, setLiveBets] = useState([]);
  const [roundHistory, setRoundHistory] = useState([]);

  // Fetch initial history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/game/history');
      setRoundHistory(res.data);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Countdown timer calculation
  useEffect(() => {
    if (gameStatus !== 'waiting' || !countdownEnd) return;

    const interval = setInterval(() => {
      const remainingMs = countdownEnd - Date.now();
      const secs = Math.max(0, Math.ceil(remainingMs / 1000));
      setCountdownSeconds(secs);
    }, 200);

    return () => clearInterval(interval);
  }, [gameStatus, countdownEnd]);

  // Socket Event Listeners
  useEffect(() => {
    const handleGameState = (data) => {
      setRoundId(data.roundId);
      setGameStatus(data.status);
      setMultiplier(data.multiplier || 1.00);
      setServerSeedHash(data.serverSeedHash || '');
      setCountdownEnd(data.countdownEnd);
    };

    const handleGameWaiting = (data) => {
      setGameStatus('waiting');
      setRoundId(data.roundId);
      setMultiplier(1.00);
      setCrashPoint(null);
      setServerSeedHash(data.serverSeedHash);
      setCountdownEnd(data.countdownEnd);
      setCountdownSeconds(5);
      setLiveBets([]);

      // Reset bets won/lost status for next round (keep settings)
      setBets((prev) => ({
        1: { ...prev[1], active: false, won: false, lost: false, profit: 0, betId: null, cashedOutAt: null },
        2: { ...prev[2], active: false, won: false, lost: false, profit: 0, betId: null, cashedOutAt: null }
      }));
    };

    const handleGameStart = (data) => {
      setGameStatus('running');
      setRoundId(data.roundId);
      setMultiplier(1.00);
      setCrashPoint(null);
    };

    const handleGameTick = (data) => {
      setMultiplier(data.multiplier);
      if (data.roundId) setRoundId(data.roundId);
    };

    const handleGameCrash = (data) => {
      setGameStatus('crashed');
      setCrashPoint(data.crashPoint);
      setMultiplier(data.crashPoint);

      // Add to round history
      setRoundHistory((prev) => [
        { roundId: data.roundId, crashPoint: data.crashPoint, serverSeedHash: data.serverSeed },
        ...prev.slice(0, 29)
      ]);

      // Update remaining active bets to lost
      setBets((prev) => ({
        1: prev[1].active ? { ...prev[1], active: false, lost: true } : prev[1],
        2: prev[2].active ? { ...prev[2], active: false, lost: true } : prev[2]
      }));
    };

    const handleBetPlaced = (data) => {
      const slot = data.slot || 1;
      setBets((prev) => ({
        ...prev,
        [slot]: {
          ...prev[slot],
          active: true,
          betId: data.betId,
          won: false,
          lost: false,
          profit: 0
        }
      }));
      if (data.newBalance !== undefined) {
        updateBalance(data.newBalance);
      }
      toast.success(`Bet placed in Slot ${slot}!`);
    };

    const handleBetWon = (data) => {
      const slot = data.slot || 1;
      setBets((prev) => ({
        ...prev,
        [slot]: {
          ...prev[slot],
          active: false,
          won: true,
          profit: data.profit,
          cashedOutAt: data.multiplier
        }
      }));
      if (data.newBalance !== undefined) {
        updateBalance(data.newBalance);
      }
      toast.success(`🎉 Cashed out at ${data.multiplier}x! Won PKR ${data.profit.toLocaleString()}!`, {
        duration: 4000,
        style: {
          background: '#064e3b',
          color: '#34d399',
          border: '1px solid #10b981'
        }
      });
    };

    const handleBetLost = (data) => {
      const slot = data.slot || 1;
      setBets((prev) => ({
        ...prev,
        [slot]: {
          ...prev[slot],
          active: false,
          lost: true
        }
      }));
    };

    const handleBetsNew = (data) => {
      setLiveBets((prev) => [
        {
          userId: data.userId,
          username: data.username,
          amount: data.amount,
          status: 'betting',
          slot: data.slot
        },
        ...prev
      ]);
    };

    const handleBetsUpdate = (data) => {
      setLiveBets((prev) =>
        prev.map((b) =>
          b.userId === data.userId
            ? { ...b, status: 'won', cashedOutAt: data.cashedOutAt, profit: data.profit }
            : b
        )
      );
    };

    const handleBetError = (data) => {
      toast.error(data.message || 'Betting error');
    };

    socket.on('game:state', handleGameState);
    socket.on('game:waiting', handleGameWaiting);
    socket.on('game:start', handleGameStart);
    socket.on('game:tick', handleGameTick);
    socket.on('game:crash', handleGameCrash);
    socket.on('bet:placed', handleBetPlaced);
    socket.on('bet:won', handleBetWon);
    socket.on('bet:lost', handleBetLost);
    socket.on('bets:new', handleBetsNew);
    socket.on('bets:update', handleBetsUpdate);
    socket.on('bet:error', handleBetError);

    return () => {
      socket.off('game:state', handleGameState);
      socket.off('game:waiting', handleGameWaiting);
      socket.off('game:start', handleGameStart);
      socket.off('game:tick', handleGameTick);
      socket.off('game:crash', handleGameCrash);
      socket.off('bet:placed', handleBetPlaced);
      socket.off('bet:won', handleBetWon);
      socket.off('bet:lost', handleBetLost);
      socket.off('bets:new', handleBetsNew);
      socket.off('bets:update', handleBetsUpdate);
      socket.off('bet:error', handleBetError);
    };
  }, [updateBalance]);

  // Action Functions
  const placeUserBet = (slot = 1, amount, autoCashoutAt) => {
    if (!user) {
      toast.error('Please login to place bets');
      return;
    }
    if (gameStatus !== 'waiting') {
      toast.error('Wait for the next round to place a bet');
      return;
    }
    if (amount <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }
    if (user.balance < amount) {
      toast.error('Insufficient balance! Please deposit to continue.');
      return;
    }

    socket.emit('bet:place', {
      amount,
      autoCashoutAt: autoCashoutAt ? parseFloat(autoCashoutAt) : null,
      slot
    });
  };

  const cashoutUserBet = (slot = 1) => {
    if (gameStatus !== 'running') {
      toast.error('Game is not currently running');
      return;
    }
    socket.emit('bet:cashout', { slot });
  };

  const updateBetSetting = (slot, key, value) => {
    setBets((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], [key]: value }
    }));
  };

  return (
    <GameContext.Provider
      value={{
        gameStatus,
        multiplier,
        roundId,
        crashPoint,
        serverSeedHash,
        countdownSeconds,
        bets,
        liveBets,
        roundHistory,
        placeUserBet,
        cashoutUserBet,
        updateBetSetting
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
