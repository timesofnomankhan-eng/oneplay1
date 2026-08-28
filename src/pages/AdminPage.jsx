import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Gamepad2, 
  Sliders, 
  ShieldAlert, 
  Check, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Bell, 
  Eye, 
  Clock, 
  Search, 
  QrCode, 
  Upload,
  RefreshCw,
  Flame,
  Calendar,
  Lock,
  Unlock,
  User,
  LogIn,
  ShieldCheck,
  Zap,
  RotateCw
} from 'lucide-react';

const AdminPage = () => {
  const { user, isAdmin, login } = useAuth();
  const { settings, refreshSettings, formatAmount } = useTheme();

  // Admin In-Page Login State (if not authenticated)
  const [adminUser, setAdminUser] = useState('Noman');
  const [adminPass, setAdminPass] = useState('@Nomankhan1');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepositAmount: 0,
    totalWithdrawAmount: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalRounds: 0,
    currentGameStatus: 'waiting',
    currentMultiplier: 1.00
  });

  // Users State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banDurationType, setBanDurationType] = useState('1h');
  const [banMessage, setBanMessage] = useState('Account restricted by administration for terms violation.');
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState('add');
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');

  // Transactions State
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [txFilter, setTxFilter] = useState('pending');
  const [screenshotModalUrl, setScreenshotModalUrl] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Helper for format local datetime
  const getFormattedLocalDateTime = (extraMinutes = 1) => {
    const d = new Date(Date.now() + extraMinutes * 60000);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // Game Control State
  const [instantCrashMult, setInstantCrashMult] = useState('1.00');
  const [scheduleMult, setScheduleMult] = useState('2.00');
  const [scheduleTime, setScheduleTime] = useState(getFormattedLocalDateTime(1));
  const [scheduledList, setScheduledList] = useState([]);
  const [gameRounds, setGameRounds] = useState([]);

  // Site Settings Form
  const [siteForm, setSiteForm] = useState({
    siteName: settings.siteName || '1play',
    siteTagline: settings.siteTagline || '',
    minDeposit: settings.minDeposit || 100,
    maxDeposit: settings.maxDeposit || 100000,
    minWithdraw: settings.minWithdraw || 200,
    maxWithdraw: settings.maxWithdraw || 50000,
    themeColors: { ...settings.themeColors },
    depositMethods: { ...settings.depositMethods }
  });

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data) setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users?search=${encodeURIComponent(userSearch)}`);
      if (res.data?.users) setUsersList(res.data.users);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Deposits
  const fetchDeposits = async () => {
    try {
      const res = await api.get(`/admin/transactions?type=deposit&status=${txFilter}`);
      if (res.data?.transactions) setDeposits(res.data.transactions);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Withdrawals
  const fetchWithdrawals = async () => {
    try {
      const res = await api.get(`/admin/transactions?type=withdraw&status=${txFilter}`);
      if (res.data?.transactions) setWithdrawals(res.data.transactions);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Game Control Data
  const fetchGameControl = async () => {
    try {
      const sched = await api.get('/admin/game/scheduled');
      if (sched.data) setScheduledList(sched.data);
      const rounds = await api.get('/admin/game/history');
      if (rounds.data?.rounds) setGameRounds(rounds.data.rounds);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'deposits') fetchDeposits();
      if (activeTab === 'withdrawals') fetchWithdrawals();
      if (activeTab === 'game') fetchGameControl();
    }
  }, [activeTab, isAdmin, txFilter]);

  // Handle In-Page Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    const res = await login(adminUser, adminPass);
    setLoginLoading(false);
    if (!res.success) {
      toast.error(res.error || 'Invalid Admin Credentials');
    }
  };

  // Handle Ban User with Flexible Time Durations
  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      let banUntil = null;
      const now = Date.now();

      if (banDurationType === '1h') banUntil = new Date(now + 1 * 3600 * 1000);
      else if (banDurationType === '6h') banUntil = new Date(now + 6 * 3600 * 1000);
      else if (banDurationType === '12h') banUntil = new Date(now + 12 * 3600 * 1000);
      else if (banDurationType === '1d') banUntil = new Date(now + 24 * 3600 * 1000);
      else if (banDurationType === '3d') banUntil = new Date(now + 3 * 24 * 3600 * 1000);
      else if (banDurationType === '7d') banUntil = new Date(now + 7 * 24 * 3600 * 1000);
      else if (banDurationType === '30d') banUntil = new Date(now + 30 * 24 * 3600 * 1000);
      else if (banDurationType === 'permanent') banUntil = null;

      await api.put(`/admin/users/${selectedUser._id}/ban`, {
        isBanned: true,
        banUntil,
        banMessage
      });

      toast.success(`⛔ User ${selectedUser.username} has been locked out in real-time!`);
      setBanModalOpen(false);
      fetchUsers();
    } catch (e) {
      toast.error('Error banning user');
    }
  };

  // Handle Instant Unban User
  const handleUnbanUser = async (u) => {
    try {
      await api.put(`/admin/users/${u._id}/unban`);
      toast.success(`✅ User ${u.username} unbanned & screen unlocked in real-time!`);
      fetchUsers();
    } catch (e) {
      toast.error('Error unbanning user');
    }
  };

  // Handle Balance Adjustment
  const handleAdjustBalance = async () => {
    if (!selectedUser || !balanceAmount) return;
    try {
      await api.put(`/admin/users/${selectedUser._id}/balance`, {
        amount: parseFloat(balanceAmount),
        type: balanceAction
      });
      toast.success(`Balance ${balanceAction === 'add' ? 'added' : 'deducted'} successfully!`);
      setBalanceModalOpen(false);
      setBalanceAmount('');
      fetchUsers();
    } catch (e) {
      toast.error('Error adjusting balance');
    }
  };

  // Handle Send Notification
  const handleSendNotification = async () => {
    if (!selectedUser || !notifyMessage.trim()) return;
    try {
      await api.post(`/admin/users/${selectedUser._id}/notify`, {
        message: notifyMessage.trim()
      });
      toast.success(`Notification sent to ${selectedUser.username}!`);
      setNotifyModalOpen(false);
      setNotifyMessage('');
    } catch (e) {
      toast.error('Error sending notification');
    }
  };

  // Handle Transaction Approve
  const handleApproveTx = async (id, type) => {
    try {
      await api.put(`/admin/transactions/${id}/approve`);
      toast.success(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} approved! User balance updated.`);
      if (type === 'deposit') fetchDeposits();
      else fetchWithdrawals();
    } catch (e) {
      toast.error('Error approving transaction');
    }
  };

  // Handle Transaction Reject
  const handleRejectTx = async () => {
    if (!selectedTx) return;
    try {
      await api.put(`/admin/transactions/${selectedTx._id}/reject`, {
        adminNote: rejectReason
      });
      toast.success('Transaction rejected.');
      setRejectModalOpen(false);
      setRejectReason('');
      if (selectedTx.type === 'deposit') fetchDeposits();
      else fetchWithdrawals();
    } catch (e) {
      toast.error('Error rejecting transaction');
    }
  };

  // Handle Instant Crash Trigger
  const handleTriggerInstantCrash = async () => {
    try {
      await api.post('/admin/game/instant-crash', { multiplier: instantCrashMult });
      toast.success(`💥 Instant crash set to ${instantCrashMult}x for next round!`);
    } catch (e) {
      toast.error('Error setting instant crash');
    }
  };

  // Handle Schedule Crash
  const handleScheduleCrash = async () => {
    if (!scheduleTime) {
      toast.error('Please select a trigger time');
      return;
    }
    try {
      await api.post('/admin/game/schedule-crash', {
        multiplier: scheduleMult,
        triggerAt: scheduleTime
      });
      toast.success(`⏰ Crash scheduled at ${scheduleMult}x for ${new Date(scheduleTime).toLocaleTimeString()}!`);
      fetchGameControl();
    } catch (e) {
      toast.error('Error scheduling crash');
    }
  };

  // Handle Remove Scheduled Crash
  const handleRemoveScheduledCrash = async (id) => {
    try {
      await api.delete(`/admin/game/scheduled/${id}`);
      toast.success('Scheduled crash removed');
      fetchGameControl();
    } catch (e) {
      toast.error('Error removing scheduled crash');
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', siteForm);
      toast.success('1play site settings and theme updated successfully!');
      refreshSettings();
    } catch (e) {
      toast.error('Error updating settings');
    }
  };

  // Handle QR Upload for Deposit Method
  const handleQRUpload = async (method, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('qrCode', file);
    try {
      const res = await api.post(`/settings/deposit-method/${method}/qr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${method} QR Code uploaded!`);
      refreshSettings();
    } catch (e) {
      toast.error('Error uploading QR');
    }
  };

  // If NOT Admin, render dedicated Admin Portal Login Form
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--theme-bg)' }}>
        <Header />
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card-glow" style={{ width: '100%', maxWidth: '440px', padding: '36px', background: 'rgba(25, 10, 18, 0.94)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img 
                src="/logo-1play.png" 
                alt="1Play" 
                style={{ height: '58px', width: 'auto', margin: '0 auto 12px', display: 'block', filter: 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.7))', objectFit: 'contain' }} 
              />
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>
                Admin Master Portal
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                Sign in with administrator credentials to manage games, users & deposits.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Admin Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Admin Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="btn btn-cashout"
                style={{ height: '48px', fontSize: '16px', fontWeight: 800, marginTop: '8px' }}
              >
                <LogIn size={18} />
                {loginLoading ? 'Authenticating Admin...' : 'Login to Admin Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin Authenticated Dashboard View
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--theme-bg)' }}>
      <Header />

      <div className="admin-layout" style={{ flex: 1 }}>
        {/* Sidebar */}
        <aside className="admin-sidebar" style={{ width: '250px', background: 'rgba(16, 6, 12, 0.96)', borderRight: '1px solid var(--border)' }}>
          <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>1play Admin</div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>Master Control</div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 10px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'users', label: 'Users Management', icon: Users },
              { id: 'deposits', label: 'Deposit Requests', icon: ArrowDownCircle },
              { id: 'withdrawals', label: 'Withdraw Requests', icon: ArrowUpCircle },
              { id: 'game', label: 'Game & Crash Control', icon: Gamepad2 },
              { id: 'settings', label: 'Site & Theme Settings', icon: Sliders }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: active ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)' : 'transparent',
                    borderLeft: active ? '3px solid #ef4444' : '3px solid transparent',
                    color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
                    fontWeight: active ? 800 : 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={18} color={active ? '#ef4444' : 'rgba(255,255,255,0.5)'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="admin-content">
          
          {/* ================= TAB 1: DASHBOARD ================= */}
          {activeTab === 'dashboard' && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>System Overview</h2>
                <button onClick={fetchStats} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <RefreshCw size={14} /> Refresh Data
                </button>
              </div>

              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registered Players</span>
                  <div className="font-game" style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginTop: '6px' }}>
                    {stats.totalUsers}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved Deposits</span>
                  <div className="font-game" style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>
                    {formatAmount(stats.totalDepositAmount)}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved Withdrawals</span>
                  <div className="font-game" style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', marginTop: '6px' }}>
                    {formatAmount(stats.totalWithdrawAmount)}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Approvals</span>
                  <div className="font-game" style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', marginTop: '6px' }}>
                    {stats.pendingDeposits} Dep / {stats.pendingWithdrawals} Wd
                  </div>
                </div>
              </div>

              {/* Live Game Status Widget */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Live Game Engine</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Engine State</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', color: stats.currentGameStatus === 'running' ? '#10b981' : '#ef4444' }}>
                      ● {stats.currentGameStatus}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Current Multiplier</span>
                    <div className="font-game" style={{ fontSize: '26px', fontWeight: 900, color: '#fff' }}>
                      {(stats.currentMultiplier || 1.00).toFixed(2)}x
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Completed Rounds</span>
                    <div className="font-game" style={{ fontSize: '26px', fontWeight: 900, color: '#3b82f6' }}>
                      #{stats.totalRounds}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: USERS MANAGEMENT ================= */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>Users Management</h2>

                <div style={{ display: 'flex', gap: '10px', width: '340px' }}>
                  <input
                    type="text"
                    placeholder="Search player username or ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <button onClick={fetchUsers} className="btn btn-secondary" style={{ padding: '0 14px' }}>
                    <Search size={16} />
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>
                      <th style={{ padding: '12px 10px' }}>User / Permanent ID</th>
                      <th style={{ padding: '12px 10px' }}>Full Name</th>
                      <th style={{ padding: '12px 10px' }}>Balance (PKR)</th>
                      <th style={{ padding: '12px 10px' }}>Account Status</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: u.isBanned ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '14px 10px' }}>
                          <div style={{ fontWeight: 800, color: '#fff' }}>{u.username}</div>
                          <div style={{ fontSize: '11px', color: '#10b981', fontFamily: 'var(--font-game)', fontWeight: 700 }}>{u.idNumber}</div>
                        </td>
                        <td style={{ padding: '14px 10px', color: 'rgba(255,255,255,0.8)' }}>
                          {u.firstName || '-'} {u.lastName || ''}
                        </td>
                        <td style={{ padding: '14px 10px', fontWeight: 800, color: '#10b981' }} className="font-game">
                          {formatAmount(u.balance)}
                        </td>
                        <td style={{ padding: '14px 10px' }}>
                          {u.role === 'admin' ? (
                            <span style={{ background: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.5)', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>
                              👑 ADMIN (IMMUNE)
                            </span>
                          ) : u.isBanned ? (
                            <span style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>
                              ⛔ BANNED {u.banUntil ? `(${new Date(u.banUntil).toLocaleTimeString()} ${new Date(u.banUntil).toLocaleDateString()})` : '(PERMANENT)'}
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            {/* Adjust Balance */}
                            <button
                              onClick={() => { setSelectedUser(u); setBalanceModalOpen(true); }}
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              title="Add/Deduct Balance"
                            >
                              Balance ±
                            </button>

                            {/* Notify */}
                            <button
                              onClick={() => { setSelectedUser(u); setNotifyModalOpen(true); }}
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              title="Send Message"
                            >
                              <Bell size={13} />
                            </button>

                            {/* PROMINENT UNBAN / BAN BUTTON (DISABLED FOR ADMINS) */}
                            {u.role === 'admin' ? (
                              <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800, padding: '5px 10px' }}>
                                🛡️ Immune
                              </span>
                            ) : u.isBanned ? (
                              <button
                                onClick={() => handleUnbanUser(u)}
                                className="btn btn-bet"
                                style={{ padding: '5px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Unlock size={13} /> Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => { setSelectedUser(u); setBanModalOpen(true); }}
                                className="btn btn-cashout"
                                style={{ padding: '5px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Lock size={13} /> Ban
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 3: DEPOSIT REQUESTS ================= */}
          {activeTab === 'deposits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>Deposit Requests</h2>

                {/* Filter */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['pending', 'approved', 'rejected', ''].map((st) => (
                    <button
                      key={st}
                      onClick={() => setTxFilter(st)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: txFilter === st ? 'rgba(224, 36, 36, 0.3)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      {st || 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>
                      <th style={{ padding: '10px' }}>User</th>
                      <th style={{ padding: '10px' }}>Method</th>
                      <th style={{ padding: '10px' }}>Amount</th>
                      <th style={{ padding: '10px' }}>TID</th>
                      <th style={{ padding: '10px' }}>Screenshot Proof</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((tx) => (
                      <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 800, color: '#fff' }}>{tx.userId?.username || 'User'}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{tx.phoneNumber}</div>
                        </td>
                        <td style={{ padding: '12px 10px', textTransform: 'uppercase', fontWeight: 700 }}>
                          {tx.method}
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 800, color: '#10b981' }} className="font-game">
                          {formatAmount(tx.amount)}
                        </td>
                        <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>
                          {tx.transactionId}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {tx.screenshotPath ? (
                            <button
                              onClick={() => setScreenshotModalUrl(tx.screenshotPath)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                              <Eye size={12} /> View Proof
                            </button>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>No file</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: tx.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : tx.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: tx.status === 'approved' ? '#34d399' : tx.status === 'rejected' ? '#f87171' : '#fbbf24'
                            }}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          {tx.status === 'pending' && (
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => handleApproveTx(tx._id, 'deposit')}
                                className="btn btn-bet"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => { setSelectedTx(tx); setRejectModalOpen(true); }}
                                className="btn btn-cashout"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 4: WITHDRAW REQUESTS ================= */}
          {activeTab === 'withdrawals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>Withdrawal Requests</h2>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {['pending', 'approved', 'rejected', ''].map((st) => (
                    <button
                      key={st}
                      onClick={() => setTxFilter(st)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: txFilter === st ? 'rgba(224, 36, 36, 0.3)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      {st || 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>
                      <th style={{ padding: '10px' }}>User</th>
                      <th style={{ padding: '10px' }}>Method</th>
                      <th style={{ padding: '10px' }}>Account / Phone</th>
                      <th style={{ padding: '10px' }}>Amount</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((tx) => (
                      <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 800, color: '#fff' }}>{tx.userId?.username || 'User'}</div>
                          <div style={{ fontSize: '11px', color: '#10b981' }}>{tx.userId?.idNumber}</div>
                        </td>
                        <td style={{ padding: '12px 10px', textTransform: 'uppercase', fontWeight: 700 }}>
                          {tx.method}
                        </td>
                        <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 700 }}>
                          {tx.accountNumber}
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 800, color: '#ef4444' }} className="font-game">
                          {formatAmount(tx.amount)}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: tx.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : tx.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: tx.status === 'approved' ? '#34d399' : tx.status === 'rejected' ? '#f87171' : '#fbbf24'
                            }}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          {tx.status === 'pending' && (
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => handleApproveTx(tx._id, 'withdraw')}
                                className="btn btn-bet"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => { setSelectedTx(tx); setRejectModalOpen(true); }}
                                className="btn btn-cashout"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                Reject & Refund
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 5: GAME & CRASH CONTROL ================= */}
          {activeTab === 'game' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>Game & Crash Control</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Instant Crash Trigger */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Flame size={20} color="#ef4444" />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                      Force Instant Crash (Next Round)
                    </h3>
                  </div>

                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                    Override provably fair outcome and force the next round to crash exactly at this multiplier value.
                  </p>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="1.00"
                      value={instantCrashMult}
                      onChange={(e) => setInstantCrashMult(e.target.value)}
                      placeholder="e.g. 1.00 or 1.35"
                      style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-game)' }}
                    />
                    <button
                      onClick={handleTriggerInstantCrash}
                      className="btn btn-cashout"
                      style={{ padding: '0 20px', whiteSpace: 'nowrap' }}
                    >
                      Set Crash
                    </button>
                  </div>
                </div>

                {/* Timely Scheduled Crash with Real-Time Pre-Fill */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={20} color="#f59e0b" />
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                        Schedule Crash by Clock Time
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScheduleTime(getFormattedLocalDateTime(1))}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      title="Sync with current time"
                    >
                      <RotateCw size={12} /> Sync Time
                    </button>
                  </div>

                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '14px' }}>
                    Current clock is pre-filled. Quick-select offset or adjust time to schedule automatically:
                  </p>

                  {/* Fast Quick Offset Buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    {[
                      { label: '+1 Min', mins: 1 },
                      { label: '+2 Mins', mins: 2 },
                      { label: '+5 Mins', mins: 5 },
                      { label: '+10 Mins', mins: 10 }
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setScheduleTime(getFormattedLocalDateTime(btn.mins))}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px', flex: 1 }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '4px' }}>Multiplier</label>
                        <input
                          type="number"
                          step="0.01"
                          min="1.00"
                          placeholder="e.g. 5.50"
                          value={scheduleMult}
                          onChange={(e) => setScheduleMult(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '4px' }}>Trigger Time (Clock)</label>
                        <input
                          type="datetime-local"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleScheduleCrash}
                      className="btn btn-bet"
                      style={{ height: '40px' }}
                    >
                      Schedule Crash
                    </button>
                  </div>
                </div>
              </div>

              {/* Scheduled Crashes List */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                  Active Scheduled Crashes
                </h3>

                {scheduledList.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                    No pending scheduled crashes.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {scheduledList.map((sc) => (
                      <div
                        key={sc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span className="font-game" style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444' }}>
                            {sc.multiplier.toFixed(2)}x
                          </span>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                            Trigger at: {new Date(sc.triggerAt).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveScheduledCrash(sc.id)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', color: '#ef4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Game History */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                  Recent Completed Rounds
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>
                        <th style={{ padding: '8px' }}>Round ID</th>
                        <th style={{ padding: '8px' }}>Crash Point</th>
                        <th style={{ padding: '8px' }}>Admin Override?</th>
                        <th style={{ padding: '8px' }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameRounds.slice(0, 10).map((r) => (
                        <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 700 }}>#{r.roundId}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 900, color: '#ef4444' }} className="font-game">
                            {r.crashPoint?.toFixed(2)}x
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            {r.isInstantCrash || r.scheduledCrashPoint ? (
                              <span style={{ color: '#f59e0b', fontWeight: 700 }}>YES</span>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Algorithm</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.5)' }}>
                            {r.endedAt ? new Date(r.endedAt).toLocaleTimeString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 6: SITE & THEME SETTINGS ================= */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>1play Site Customization & Themes</h2>
                <button type="submit" className="btn btn-bet" style={{ height: '42px', padding: '0 24px' }}>
                  Save All Settings
                </button>
              </div>

              {/* General Info */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
                  General Branding
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                      Website Name
                    </label>
                    <input
                      type="text"
                      value={siteForm.siteName}
                      onChange={(e) => setSiteForm({ ...siteForm, siteName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                      Tagline / Subtitle
                    </label>
                    <input
                      type="text"
                      value={siteForm.siteTagline}
                      onChange={(e) => setSiteForm({ ...siteForm, siteTagline: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Theme Colors Editor */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
                  Live Theme & Button Colors
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {[
                    { key: 'background', label: 'Background' },
                    { key: 'primary', label: 'Primary Crimson' },
                    { key: 'betButton', label: 'Bet Button (Green)' },
                    { key: 'cashoutButton', label: 'Cashout Button (Red)' },
                    { key: 'depositButton', label: 'Deposit Button' },
                    { key: 'withdrawButton', label: 'Withdraw Button' }
                  ].map((colorItem) => (
                    <div key={colorItem.key}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                        {colorItem.label}
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={siteForm.themeColors?.[colorItem.key] || '#ef4444'}
                          onChange={(e) =>
                            setSiteForm({
                              ...siteForm,
                              themeColors: { ...siteForm.themeColors, [colorItem.key]: e.target.value }
                            })
                          }
                          style={{ width: '44px', height: '40px', padding: '2px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={siteForm.themeColors?.[colorItem.key] || ''}
                          onChange={(e) =>
                            setSiteForm({
                              ...siteForm,
                              themeColors: { ...siteForm.themeColors, [colorItem.key]: e.target.value }
                            })
                          }
                          style={{ fontSize: '12px', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods Config */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
                  Payment Methods & QR Codes
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  {['easypaisa', 'jazzcash', 'bank'].map((m) => {
                    const methodObj = siteForm.depositMethods?.[m] || {};
                    return (
                      <div
                        key={m}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <strong style={{ textTransform: 'uppercase', color: '#fff' }}>{m}</strong>

                        <div>
                          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Account Number</label>
                          <input
                            type="text"
                            value={methodObj.accountNumber || ''}
                            onChange={(e) =>
                              setSiteForm({
                                ...siteForm,
                                depositMethods: {
                                  ...siteForm.depositMethods,
                                  [m]: { ...methodObj, accountNumber: e.target.value }
                                }
                              })
                            }
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Account Title</label>
                          <input
                            type="text"
                            value={methodObj.accountTitle || ''}
                            onChange={(e) =>
                              setSiteForm({
                                ...siteForm,
                                depositMethods: {
                                  ...siteForm.depositMethods,
                                  [m]: { ...methodObj, accountTitle: e.target.value }
                                }
                              })
                            }
                          />
                        </div>

                        {/* QR Upload */}
                        <div>
                          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Upload QR Code</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleQRUpload(m, e.target.files[0])}
                            style={{ fontSize: '11px', padding: '6px' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Limits */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
                  Transaction Limits (PKR)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Min Deposit</label>
                    <input
                      type="number"
                      value={siteForm.minDeposit}
                      onChange={(e) => setSiteForm({ ...siteForm, minDeposit: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Max Deposit</label>
                    <input
                      type="number"
                      value={siteForm.maxDeposit}
                      onChange={(e) => setSiteForm({ ...siteForm, maxDeposit: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Min Withdraw</label>
                    <input
                      type="number"
                      value={siteForm.minWithdraw}
                      onChange={(e) => setSiteForm({ ...siteForm, minWithdraw: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Max Withdraw</label>
                    <input
                      type="number"
                      value={siteForm.maxWithdraw}
                      onChange={(e) => setSiteForm({ ...siteForm, maxWithdraw: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

            </form>
          )}

        </main>
      </div>

      {/* ================= MODALS ================= */}

      {/* Screenshot Preview Modal */}
      {screenshotModalUrl && (
        <div className="modal-backdrop" onClick={() => setScreenshotModalUrl(null)}>
          <div className="glass-card" style={{ maxWidth: '600px', maxHeight: '80vh', padding: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong>Payment Proof Screenshot</strong>
              <button onClick={() => setScreenshotModalUrl(null)} className="btn btn-secondary" style={{ padding: '2px 8px' }}><X size={16} /></button>
            </div>
            <img src={screenshotModalUrl} alt="Proof" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </div>
      )}

      {/* Ban User Modal with Duration Presets */}
      {banModalOpen && selectedUser && (
        <div className="modal-backdrop" onClick={() => setBanModalOpen(false)}>
          <div className="glass-card-glow" style={{ width: '460px', padding: '28px', background: 'rgba(28, 10, 18, 0.96)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Lock size={22} color="#ef4444" />
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444' }}>
                Restrict Player: {selectedUser.username}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Select Ban Duration (Real-time Countdown on user screen)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                  {[
                    { id: '1h', label: '1 Hour' },
                    { id: '6h', label: '6 Hours' },
                    { id: '12h', label: '12 Hours' },
                    { id: '1d', label: '1 Day' },
                    { id: '3d', label: '3 Days' },
                    { id: '7d', label: '7 Days' },
                    { id: '30d', label: '30 Days' },
                    { id: 'permanent', label: 'Permanent' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setBanDurationType(preset.id)}
                      style={{
                        padding: '8px 4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: banDurationType === preset.id ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'rgba(255,255,255,0.05)',
                        border: banDurationType === preset.id ? '1px solid #ef4444' : '1px solid var(--border)',
                        color: '#fff'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Ban Reason (Displayed prominently on player's blurred screen)
                </label>
                <textarea
                  rows={3}
                  value={banMessage}
                  onChange={(e) => setBanMessage(e.target.value)}
                  placeholder="Enter reason for restriction..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button onClick={() => setBanModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button onClick={handleBanUser} className="btn btn-cashout" style={{ flex: 1 }}>
                  Confirm & Lockout Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {balanceModalOpen && selectedUser && (
        <div className="modal-backdrop" onClick={() => setBalanceModalOpen(false)}>
          <div className="glass-card" style={{ width: '380px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
              Adjust Balance ({selectedUser.username})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBalanceAction('add')}
                  className={balanceAction === 'add' ? 'btn btn-bet' : 'btn btn-secondary'}
                >
                  <Plus size={16} /> Add Balance
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceAction('deduct')}
                  className={balanceAction === 'deduct' ? 'btn btn-cashout' : 'btn btn-secondary'}
                >
                  <Minus size={16} /> Deduct
                </button>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Amount (PKR)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                />
              </div>

              <button onClick={handleAdjustBalance} className="btn btn-bet" style={{ marginTop: '8px' }}>
                Submit Balance Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify Modal */}
      {notifyModalOpen && selectedUser && (
        <div className="modal-backdrop" onClick={() => setNotifyModalOpen(false)}>
          <div className="glass-card" style={{ width: '400px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
              Send Notification ({selectedUser.username})
            </h3>
            <textarea
              rows={4}
              placeholder="Enter message for user..."
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
            />
            <button onClick={handleSendNotification} className="btn btn-bet" style={{ width: '100%', marginTop: '14px' }}>
              Send Notification
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedTx && (
        <div className="modal-backdrop" onClick={() => setRejectModalOpen(false)}>
          <div className="glass-card" style={{ width: '400px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', marginBottom: '14px' }}>
              Reject {selectedTx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </h3>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Rejection Reason</label>
            <textarea
              rows={3}
              placeholder="e.g. Invalid TID, receipt screenshot unreadable..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ marginTop: '6px' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={() => setRejectModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleRejectTx} className="btn btn-cashout" style={{ flex: 1 }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;
