import React from 'react';
import { useGame } from '../../context/GameContext';
import { useTheme } from '../../context/ThemeContext';
import { Users, CheckCircle2, XCircle } from 'lucide-react';

const LiveBetsPanel = () => {
  const { liveBets, gameStatus, multiplier } = useGame();
  const { formatAmount } = useTheme();

  const totalBetsAmount = liveBets.reduce((acc, b) => acc + (b.amount || 0), 0);

  return (
    <aside
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        background: 'rgba(15, 6, 11, 0.85)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} color="#ef4444" />
          <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            All Bets
          </span>
          <span
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 800
            }}
          >
            {liveBets.length}
          </span>
        </div>

        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
          {formatAmount(totalBetsAmount)}
        </div>
      </div>

      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 60px 70px',
          padding: '8px 16px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <span>User</span>
        <span style={{ textAlign: 'right' }}>Bet</span>
        <span style={{ textAlign: 'right' }}>Cashout</span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {liveBets.length === 0 ? (
          <div
            style={{
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.3)',
              textAlign: 'center',
              padding: '20px'
            }}
          >
            No bets placed for this round yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {liveBets.map((bet, index) => {
              const isWon = bet.status === 'won';
              const isLost = gameStatus === 'crashed' && !isWon;

              return (
                <div
                  key={`${bet.userId}_${bet.slot}_${index}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 70px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    alignItems: 'center',
                    background: isWon 
                      ? 'rgba(16, 185, 129, 0.12)' 
                      : isLost 
                      ? 'rgba(239, 68, 68, 0.08)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    borderLeft: isWon 
                      ? '3px solid #10b981' 
                      : isLost 
                      ? '3px solid #ef4444' 
                      : '3px solid rgba(255,255,255,0.2)'
                  }}
                >
                  {/* Username */}
                  <span style={{ fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bet.username || 'Player'}
                  </span>

                  {/* Bet Amount */}
                  <span
                    className="font-game"
                    style={{ textAlign: 'right', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}
                  >
                    {formatAmount(bet.amount, false)}
                  </span>

                  {/* Cashout / Result */}
                  <div style={{ textAlign: 'right' }}>
                    {isWon ? (
                      <span
                        className="font-game"
                        style={{
                          color: '#10b981',
                          fontWeight: 800,
                          fontSize: '13px'
                        }}
                      >
                        {bet.cashedOutAt?.toFixed(2)}x
                      </span>
                    ) : isLost ? (
                      <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>
                        LOST
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                        ...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

export default LiveBetsPanel;
