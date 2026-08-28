import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import toast from 'react-hot-toast';
import { ArrowUpCircle, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';

const WithdrawPage = () => {
  const { user, updateBalance } = useAuth();
  const { settings, formatAmount } = useTheme();

  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState('easypaisa');
  const [accountNumber, setAccountNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/withdraw/my');
      setHistory(res.data);
    } catch (err) {
      console.error('Fetch withdrawals error:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }

    const minW = settings?.minWithdraw || 200;
    const maxW = settings?.maxWithdraw || 50000;

    if (withdrawAmount < minW) {
      toast.error(`Minimum withdrawal is PKR ${minW}`);
      return;
    }

    if (withdrawAmount > maxW) {
      toast.error(`Maximum withdrawal is PKR ${maxW}`);
      return;
    }

    if (!user || user.balance < withdrawAmount) {
      toast.error('Insufficient balance for this withdrawal');
      return;
    }

    if (!accountNumber.trim()) {
      toast.error('Please enter your receiving account number / IBAN');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/withdraw/request', {
        amount: withdrawAmount,
        method,
        accountNumber,
        phoneNumber
      });

      toast.success(res.data.message || 'Withdrawal request submitted!');
      if (res.data.newBalance !== undefined) {
        updateBalance(res.data.newBalance);
      }
      setAmount('500');
      setAccountNumber('');
      setPhoneNumber('');
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--theme-bg)' }}>
      <Header />

      <main style={{ flex: 1, padding: '30px 20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowUpCircle size={28} color="#ef4444" />
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>
              Withdraw Funds
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
            Transfer your winnings directly to your EasyPaisa, JazzCash, or Bank account.
          </p>
        </div>

        {/* Balance Card */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(20, 8, 15, 0.8) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <div>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
              Available Balance
            </span>
            <div className="font-game" style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>
              {formatAmount(user?.balance || 0)}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
            <div>Min Withdraw: <strong>PKR {settings?.minWithdraw || 200}</strong></div>
            <div>Max Withdraw: <strong>PKR {settings?.maxWithdraw || 50000}</strong></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Method selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                Select Withdrawal Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {['easypaisa', 'jazzcash', 'bank'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: method === m ? '2px solid #ef4444' : '1px solid var(--border)',
                      background: method === m ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    {m === 'easypaisa' ? 'EasyPaisa' : m === 'jazzcash' ? 'JazzCash' : 'Bank'}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                Withdrawal Amount (PKR) *
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-game)' }}
              />
            </div>

            {/* Account / Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                Receiving Account / Mobile Number / IBAN *
              </label>
              <input
                type="text"
                placeholder={method === 'bank' ? 'Account Number / IBAN' : 'Mobile Number (e.g. 03001234567)'}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                Contact Mobile Number
              </label>
              <input
                type="text"
                placeholder="Your WhatsApp / Contact number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-cashout"
              style={{ height: '48px', fontSize: '16px', marginTop: '10px' }}
            >
              <CheckCircle2 size={18} />
              {loading ? 'Processing Request...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="glass-card" style={{ marginTop: '30px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
            Withdrawal History
          </h3>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              No withdrawal requests made yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Method</th>
                    <th style={{ padding: '10px' }}>Account</th>
                    <th style={{ padding: '10px' }}>Amount</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => (
                    <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.7)' }}>
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '12px 10px', textTransform: 'uppercase', fontWeight: 700 }}>
                        {tx.method}
                      </td>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>
                        {tx.accountNumber}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 800, color: '#ef4444' }} className="font-game">
                        {formatAmount(tx.amount)}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default WithdrawPage;
