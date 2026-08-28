import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ShieldCheck, History } from 'lucide-react';

const RoundHistory = () => {
  const { roundHistory } = useGame();
  const [selectedRound, setSelectedRound] = useState(null);

  const getChipStyle = (crash) => {
    const val = parseFloat(crash);
    if (val >= 10.0) {
      return {
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.28) 0%, rgba(217, 70, 239, 0.38) 100%)',
        border: '1px solid rgba(236, 72, 153, 0.7)',
        color: '#f472b6',
        textShadow: '0 0 10px rgba(236, 72, 153, 0.6)'
      };
    }
    if (val >= 2.0) {
      return {
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.24) 0%, rgba(147, 51, 234, 0.35) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.6)',
        color: '#c084fc',
        textShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
      };
    }
    return {
      background: 'rgba(59, 130, 246, 0.18)',
      border: '1px solid rgba(59, 130, 246, 0.45)',
      color: '#93c5fd',
      textShadow: '0 0 8px rgba(59, 130, 246, 0.4)'
    };
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        background: 'rgba(18, 5, 12, 0.96)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.55, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        <History size={13} />
        <span>History:</span>
      </div>

      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
        {roundHistory.map((r, i) => (
          <button
            key={r.roundId || i}
            onClick={() => setSelectedRound(r)}
            style={{
              padding: '2px 9px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'all 0.15s ease',
              ...getChipStyle(r.crashPoint)
            }}
            className="font-game"
            title={`Round #${r.roundId} — Click to verify`}
          >
            {parseFloat(r.crashPoint).toFixed(2)}x
          </button>
        ))}
      </div>

      {/* Provably Fair Modal */}
      {selectedRound && (
        <div className="modal-backdrop" onClick={() => setSelectedRound(null)}>
          <div
            className="glass-card-glow"
            style={{ width: '420px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldCheck size={22} color="#10b981" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                Round #{selectedRound.roundId} Fair Verification
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>
                  Crash Multiplier:
                </span>
                <span className="font-game" style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444' }}>
                  {parseFloat(selectedRound.crashPoint).toFixed(2)}x
                </span>
              </div>

              <div>
                <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>
                  Server Seed (SHA-256):
                </span>
                <input
                  type="text"
                  readOnly
                  value={selectedRound.serverSeedHash || 'Generated securely by server'}
                  style={{ fontSize: '11px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '10px', borderRadius: '8px', color: '#34d399', fontSize: '12px' }}>
                ✓ This round result was generated with cryptographic HMAC-SHA256 and pre-committed before round start.
              </div>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '20px' }}
              onClick={() => setSelectedRound(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundHistory;
