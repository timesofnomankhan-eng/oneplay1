import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Clock, LogOut, Lock, AlertTriangle } from 'lucide-react';

const BanOverlay = () => {
  const { user, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!user?.isBanned || !user?.banUntil) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(user.banUntil) - new Date();
      if (difference <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days,
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [user?.isBanned, user?.banUntil]);

  if (!user || !user.isBanned) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 3, 6, 0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        className="glass-card-glow"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '40px 32px',
          background: 'linear-gradient(145deg, rgba(35, 10, 20, 0.95) 0%, rgba(18, 5, 12, 0.98) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 25px 60px -15px rgba(239, 68, 68, 0.35), 0 0 40px rgba(224, 36, 36, 0.2)',
          borderRadius: '18px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Warning Glow Stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #ef4444 100%)',
            boxShadow: '0 0 12px #ef4444'
          }}
        />

        {/* Shield Icon */}
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.4) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)'
          }}
          className="anim-glow"
        >
          <Lock size={38} color="#ef4444" />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(239, 68, 68, 0.7)'
          }}
        >
          Account Restricted
        </h2>

        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '6px' }}>
          Player: <strong style={{ color: '#fff' }}>{user.username}</strong> | ID: <span style={{ color: '#34d399', fontFamily: 'var(--font-game)', fontWeight: 800 }}>{user.idNumber}</span>
        </p>

        {/* Ban Message Box */}
        <div
          style={{
            margin: '22px 0',
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#f87171', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
            <AlertTriangle size={15} />
            Reason from Administrator
          </div>
          <div style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1.5, fontWeight: 500 }}>
            "{user.banMessage || 'Your account has been restricted by the administrator. All betting, deposits, and game interactions are locked.'}"
          </div>
        </div>

        {/* Time Remaining Counter */}
        {user.banUntil && timeLeft && timeLeft !== 'EXPIRED' ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '26px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#fbbf24', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              <Clock size={15} />
              Restriction Time Remaining
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {timeLeft.days > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="font-game" style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                    {timeLeft.days}
                  </span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Days</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="font-game" style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                  {timeLeft.hours}
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Hours</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>:</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="font-game" style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                  {timeLeft.minutes}
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Mins</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>:</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="font-game" style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>
                  {timeLeft.seconds}
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Secs</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              marginBottom: '26px',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            Permanent Suspension — Contact Administrator for appeals.
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="btn btn-cashout"
          style={{
            width: '100%',
            height: '48px',
            fontSize: '15px',
            fontWeight: 800,
            borderRadius: '10px',
            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)'
          }}
        >
          <LogOut size={18} />
          Log Out of Account
        </button>
      </div>
    </div>
  );
};

export default BanOverlay;
