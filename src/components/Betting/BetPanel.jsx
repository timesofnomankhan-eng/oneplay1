import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Plus, Minus, Check, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

const SingleBetSlot = ({ slot = 1 }) => {
  const { user } = useAuth();
  const { gameStatus, multiplier, bets, placeUserBet, cashoutUserBet, updateBetSetting } = useGame();
  const { formatAmount } = useTheme();

  const slotData = bets[slot] || {};
  const [amount, setAmount] = useState(slotData.amount || 100);
  const [autoCashout, setAutoCashout] = useState(false);
  const [targetMultiplier, setTargetMultiplier] = useState('2.00');

  const presetAmounts = [50, 100, 500, 1000, 5000];

  const handleAmountChange = (newAmount) => {
    const val = Math.max(10, Math.floor(newAmount));
    setAmount(val);
    updateBetSetting(slot, 'amount', val);
  };

  const handlePlaceBet = () => {
    placeUserBet(slot, amount, autoCashout ? targetMultiplier : null);
  };

  const handleCashout = () => {
    cashoutUserBet(slot);
  };

  const currentProfit = slotData.active ? (amount * multiplier) : 0;

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'rgba(25, 10, 18, 0.75)',
        border: slotData.active ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
          Bet #{slot}
        </span>
        {slotData.active && (
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: 800, 
              background: 'rgba(16, 185, 129, 0.2)', 
              color: '#34d399', 
              padding: '2px 8px', 
              borderRadius: '10px' 
            }}
          >
            IN PLAY
          </span>
        )}
      </div>

      {/* Amount Input with +/- */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button
          onClick={() => handleAmountChange(amount - 50)}
          disabled={slotData.active || gameStatus === 'running'}
          className="btn btn-secondary"
          style={{ width: '38px', height: '38px', padding: 0 }}
        >
          <Minus size={16} />
        </button>

        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(Number(e.target.value))}
            disabled={slotData.active || gameStatus === 'running'}
            style={{
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '16px',
              fontFamily: 'var(--font-game)',
              padding: '8px'
            }}
          />
        </div>

        <button
          onClick={() => handleAmountChange(amount + 50)}
          disabled={slotData.active || gameStatus === 'running'}
          className="btn btn-secondary"
          style={{ width: '38px', height: '38px', padding: 0 }}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Quick Amount Buttons */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
        {presetAmounts.map((preset) => (
          <button
            key={preset}
            onClick={() => handleAmountChange(preset)}
            disabled={slotData.active || gameStatus === 'running'}
            style={{
              flex: 1,
              padding: '4px 0',
              fontSize: '11px',
              fontWeight: 700,
              background: amount === preset ? 'rgba(224, 36, 36, 0.3)' : 'rgba(255,255,255,0.05)',
              border: amount === preset ? '1px solid rgba(224, 36, 36, 0.6)' : '1px solid var(--border)',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Auto Cashout Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div
          onClick={() => !slotData.active && setAutoCashout(!autoCashout)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: slotData.active ? 'not-allowed' : 'pointer',
            userSelect: 'none'
          }}
        >
          {autoCashout ? (
            <ToggleRight size={22} color="#10b981" />
          ) : (
            <ToggleLeft size={22} color="rgba(255,255,255,0.4)" />
          )}
          <span style={{ fontSize: '12px', fontWeight: 600, color: autoCashout ? '#10b981' : 'rgba(255,255,255,0.6)' }}>
            Auto Cashout
          </span>
        </div>

        {autoCashout && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '90px' }}>
            <input
              type="number"
              step="0.1"
              min="1.01"
              value={targetMultiplier}
              onChange={(e) => setTargetMultiplier(e.target.value)}
              disabled={slotData.active}
              style={{
                padding: '4px 8px',
                fontSize: '13px',
                fontWeight: 800,
                textAlign: 'center',
                fontFamily: 'var(--font-game)'
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>x</span>
          </div>
        )}
      </div>

      {/* Action Button: BET or CASHOUT */}
      {slotData.active && gameStatus === 'running' ? (
        <button
          onClick={handleCashout}
          className="btn btn-cashout"
          style={{
            height: '52px',
            fontSize: '18px',
            fontWeight: 900,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            lineHeight: 1.1
          }}
        >
          <span>CASH OUT</span>
          <span className="font-game" style={{ fontSize: '15px', fontWeight: 800 }}>
            {formatAmount(currentProfit)} ({multiplier.toFixed(2)}x)
          </span>
        </button>
      ) : slotData.won ? (
        <div
          style={{
            height: '52px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.4) 100%)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Cashed Out!</span>
          <span className="font-game" style={{ fontSize: '18px', fontWeight: 900 }}>
            + {formatAmount(slotData.profit)} ({slotData.cashedOutAt}x)
          </span>
        </div>
      ) : (
        <button
          onClick={handlePlaceBet}
          disabled={slotData.active || gameStatus !== 'waiting'}
          className="btn btn-bet"
          style={{
            height: '52px',
            fontSize: '18px',
            fontWeight: 900,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            lineHeight: 1.1
          }}
        >
          {slotData.active ? (
            <span>WAITING ROUND...</span>
          ) : (
            <>
              <span>BET</span>
              <span className="font-game" style={{ fontSize: '14px', fontWeight: 700, opacity: 0.9 }}>
                {formatAmount(amount)}
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

const BetPanel = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        height: '100%',
        overflowY: 'auto'
      }}
    >
      <SingleBetSlot slot={1} />
      <SingleBetSlot slot={2} />
    </div>
  );
};

export default BetPanel;
