import React from 'react';
import Header from '../components/Header/Header';
import CrashGraph from '../components/Game/CrashGraph';
import MultiplierDisplay from '../components/Game/MultiplierDisplay';
import RoundHistory from '../components/Game/RoundHistory';
import BetPanel from '../components/Betting/BetPanel';
import LiveBetsPanel from '../components/LiveBets/LiveBetsPanel';

const GamePage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#090306' }}>
      <Header />
      
      {/* Game Layout */}
      <div 
        style={{ 
          flex: 1, 
          display: 'grid', 
          gridTemplateColumns: '270px 1fr 360px', 
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #13040b 0%, #080205 100%)'
        }}
      >
        {/* Left: Multiplayer Live Bets Feed */}
        <div style={{ height: '100%', overflow: 'hidden', borderRight: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(16, 5, 11, 0.85)', backdropFilter: 'blur(12px)' }}>
          <LiveBetsPanel />
        </div>

        {/* Center: Aviator Stage & Graph with Luxury Background */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <RoundHistory />
          
          <div 
            style={{ 
              flex: 1, 
              position: 'relative', 
              overflow: 'hidden',
              backgroundImage: 'radial-gradient(circle at center, rgba(19, 4, 11, 0.65) 0%, rgba(9, 2, 6, 0.9) 100%), url("/bg-casino-girl.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.85)'
            }}
          >
            {/* Ambient Red Neon Glow Filter */}
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 60% 40%, rgba(239, 68, 68, 0.15) 0%, transparent 60%)',
                pointerEvents: 'none'
              }}
            />
            <CrashGraph />
            <MultiplierDisplay />
          </div>
        </div>

        {/* Right: Betting Controls */}
        <div style={{ height: '100%', overflow: 'hidden', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(16, 5, 11, 0.88)', backdropFilter: 'blur(16px)' }}>
          <BetPanel />
        </div>
      </div>
    </div>
  );
};

export default GamePage;
