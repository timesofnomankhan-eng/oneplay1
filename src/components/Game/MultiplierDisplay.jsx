import React from 'react';
import { useGame } from '../../context/GameContext';

const MultiplierDisplay = () => {
  const { gameStatus, multiplier, crashPoint, countdownSeconds } = useGame();

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 10,
        userSelect: 'none'
      }}
    >
      {gameStatus === 'waiting' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              border: '3px solid rgba(224, 36, 36, 0.4)',
              borderTopColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spin 1.5s linear infinite',
              position: 'relative'
            }}
          >
            <span
              className="font-game"
              style={{
                fontSize: '38px',
                fontWeight: 900,
                color: '#ffffff',
                textShadow: '0 0 15px rgba(239, 68, 68, 0.8)'
              }}
            >
              {countdownSeconds}
            </span>
          </div>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.7)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginTop: '6px'
            }}
          >
            Starting In {countdownSeconds}s...
          </span>
          <div
            style={{
              width: '160px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '4px'
            }}
          >
            <div
              style={{
                width: `${(countdownSeconds / 5) * 100}%`,
                height: '100%',
                backgroundColor: '#ef4444',
                transition: 'width 0.2s linear'
              }}
            />
          </div>
        </div>
      )}

      {gameStatus === 'running' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            className="font-game"
            style={{
              fontSize: multiplier >= 10 ? '76px' : '88px',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1,
              textShadow: multiplier >= 2.0 
                ? '0 0 35px rgba(239, 68, 68, 0.9), 0 0 70px rgba(224, 36, 36, 0.5)' 
                : '0 0 25px rgba(255, 255, 255, 0.4)',
              transition: 'all 0.05s ease-out'
            }}
          >
            {multiplier.toFixed(2)}x
          </div>
        </div>
      )}

      {gameStatus === 'crashed' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#ef4444',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '4px',
              textShadow: '0 0 20px rgba(239, 68, 68, 0.8)'
            }}
          >
            Flew Away!
          </span>
          <div
            className="font-game"
            style={{
              fontSize: '72px',
              fontWeight: 900,
              color: '#ef4444',
              lineHeight: 1,
              textShadow: '0 0 40px rgba(239, 68, 68, 0.95)'
            }}
          >
            {(crashPoint || multiplier).toFixed(2)}x
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplierDisplay;
