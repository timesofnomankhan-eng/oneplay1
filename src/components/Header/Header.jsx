import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Clock, 
  Wallet, 
  User, 
  ChevronDown, 
  LogOut, 
  ShieldAlert, 
  Settings as SettingsIcon, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Bell
} from 'lucide-react';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { settings, selectedCurrency, changeCurrency, formatAmount, currencies } = useTheme();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [pakistanTime, setPakistanTime] = useState('');
  const [timePeriod, setTimePeriod] = useState('AM');
  const dropdownRef = useRef(null);
  const currencyRef = useRef(null);

  // Pakistan Time Clock (UTC+5) - 12-hour AM/PM format
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const pkt = new Date(utc + (3600000 * 5));
      
      let rawHours = pkt.getHours();
      const ampm = rawHours >= 12 ? 'PM' : 'AM';
      let hours12 = rawHours % 12;
      hours12 = hours12 ? hours12 : 12;
      
      const strHours = String(hours12).padStart(2, '0');
      const minutes = String(pkt.getMinutes()).padStart(2, '0');
      const seconds = String(pkt.getSeconds()).padStart(2, '0');
      setPakistanTime(`${strHours}:${minutes}:${seconds}`);
      setTimePeriod(ampm);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      style={{
        height: '66px',
        backgroundColor: 'rgba(14, 4, 9, 0.96)',
        borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
      }}
    >
      {/* Left: 1play Brand Logo + STYLISH DIGITAL CLOCK DIRECTLY NEXT TO LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img 
            src="/logo-1play.png" 
            alt="1Play" 
            style={{ height: '48px', width: 'auto', filter: 'drop-shadow(0 0 14px rgba(239, 68, 68, 0.6))', objectFit: 'contain' }} 
          />
        </Link>

        {/* Single-line Digital Clock with 7-Segment Digits */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: '4px'
          }}
        >
          <div 
            style={{ 
              width: '7px', 
              height: '7px', 
              borderRadius: '50%', 
              background: '#ef4444', 
              boxShadow: '0 0 10px #ef4444' 
            }} 
            className="anim-glow" 
          />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {/* 7-Segment Digital Font for Digits Only */}
            <span 
              className="font-digital" 
              style={{ 
                fontSize: '20px', 
                fontWeight: 900, 
                color: '#ffffff', 
                lineHeight: 1,
                textShadow: '0 0 12px rgba(255, 255, 255, 0.5), 0 0 20px rgba(239, 68, 68, 0.4)'
              }}
            >
              {pakistanTime || '00:00:00'}
            </span>

            {/* Standard Clean Font for AM/PM */}
            <span 
              style={{ 
                fontFamily: "'Rajdhani', 'Inter', sans-serif",
                fontSize: '13px', 
                fontWeight: 900, 
                color: '#fbbf24', 
                letterSpacing: '0.5px',
                lineHeight: 1,
                textShadow: '0 0 8px rgba(251, 191, 36, 0.4)'
              }}
            >
              {timePeriod}
            </span>

            {/* Standard Clean Font for Timezone */}
            <span 
              style={{ 
                fontFamily: "'Rajdhani', 'Inter', sans-serif",
                fontSize: '11px', 
                fontWeight: 800, 
                color: '#9ca3af', 
                textTransform: 'uppercase', 
                letterSpacing: '0.8px',
                lineHeight: 1
              }}
            >
              PST (GMT+5)
            </span>
          </div>
        </div>
      </div>

      {/* Right Side: Currency + Balance + Deposit + User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Currency Switcher */}
        <div style={{ position: 'relative' }} ref={currencyRef}>
          <button
            onClick={() => setCurrencyOpen(!currencyOpen)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '9px',
              padding: '7px 12px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <span>{selectedCurrency}</span>
            <ChevronDown size={14} color="rgba(255,255,255,0.6)" />
          </button>

          {currencyOpen && (
            <div 
              className="glass-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '150px',
                padding: '6px',
                zIndex: 200,
                boxShadow: '0 15px 35px rgba(0,0,0,0.7)'
              }}
            >
              {Object.keys(currencies).map((code) => (
                <div
                  key={code}
                  onClick={() => {
                    changeCurrency(code);
                    setCurrencyOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: selectedCurrency === code ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                    color: selectedCurrency === code ? '#ef4444' : '#fff'
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{code}</span>
                  <span style={{ opacity: 0.6 }}>{currencies[code].symbol}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <>
            {/* VIP Balance Display with integrated + Deposit button (Compact Size) */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.08) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                padding: '3px 4px 3px 10px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.15)'
              }}
            >
              <Wallet size={13} color="#10b981" />
              <span className="font-game" style={{ fontSize: '14px', fontWeight: 900, color: '#34d399', letterSpacing: '0.5px' }}>
                {formatAmount(user.balance)}
              </span>
              <Link
                to="/deposit"
                title="Deposit Funds"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 900,
                  textDecoration: 'none',
                  marginLeft: '2px',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.5)',
                  lineHeight: 1,
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                +
              </Link>
            </div>

            {/* User Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '5px 10px 5px 6px',
                  cursor: 'pointer'
                }}
              >
                {user.profilePic ? (
                  <img 
                    src={user.profilePic} 
                    alt={user.username} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ef4444' }} 
                  />
                ) : (
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: '#fff'
                    }}
                  >
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                    {user.username}
                  </span>
                  <span style={{ fontSize: '10px', color: '#34d399', fontFamily: 'var(--font-game)', fontWeight: 700, lineHeight: 1 }}>
                    {user.idNumber}
                  </span>
                </div>
                <ChevronDown size={14} color="rgba(255,255,255,0.7)" />
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div 
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '220px',
                    padding: '8px',
                    zIndex: 200,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.7)'
                  }}
                >
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{user.firstName ? `${user.firstName} ${user.lastName}` : user.username}</div>
                    <div style={{ fontSize: '11px', color: '#34d399', fontFamily: 'var(--font-game)', fontWeight: 800 }}>ID: {user.idNumber}</div>
                  </div>

                  <Link
                    to="/account"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      color: '#fff',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                    className="btn-secondary"
                  >
                    <SettingsIcon size={16} />
                    Account Settings
                  </Link>

                  <Link
                    to="/deposit"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      color: '#34d399',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      marginTop: '4px'
                    }}
                    className="btn-secondary"
                  >
                    <ArrowDownCircle size={16} color="#10b981" />
                    Deposit Funds
                  </Link>

                  <Link
                    to="/withdraw"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      color: '#f87171',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      marginTop: '4px'
                    }}
                    className="btn-secondary"
                  >
                    <ArrowUpCircle size={16} color="#ef4444" />
                    Withdraw Funds
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        color: '#fbbf24',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 800,
                        marginTop: '4px'
                      }}
                      className="btn-secondary"
                    >
                      <ShieldAlert size={16} color="#f59e0b" />
                      Admin Control Panel
                    </Link>
                  )}

                  <div 
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      marginTop: '6px',
                      borderTop: '1px solid var(--border)'
                    }}
                    className="btn-secondary"
                  >
                    <LogOut size={16} />
                    Logout
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>
              Login
            </Link>
            <Link to="/register" className="btn btn-bet" style={{ padding: '8px 18px', fontSize: '13px' }}>
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
