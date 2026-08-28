import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import toast from 'react-hot-toast';
import { 
  ArrowDownCircle, 
  Upload, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Copy, 
  FileText,
  AlertCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const DepositPage = () => {
  const { user } = useAuth();
  const { settings, formatAmount } = useTheme();

  const [activeMethod, setActiveMethod] = useState('easypaisa');
  const [amount, setAmount] = useState('500');
  const [transactionId, setTransactionId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Fetch user deposit history
  const fetchHistory = async () => {
    try {
      const res = await api.get('/deposit/my');
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching deposits:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }

    if (!transactionId.trim()) {
      toast.error('Please enter the Transaction ID from your payment receipt');
      return;
    }

    if (!screenshot) {
      toast.error('Please upload a screenshot proof of your transaction');
      return;
    }

    const minDep = settings?.minDeposit || 100;
    if (parseFloat(amount) < minDep) {
      toast.error(`Minimum deposit is PKR ${minDep}`);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('method', activeMethod);
    formData.append('transactionId', transactionId);
    formData.append('phoneNumber', phoneNumber);
    formData.append('screenshot', screenshot);

    try {
      const res = await api.post('/deposit/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Deposit submitted! Admin will verify.');
      setTransactionId('');
      setPhoneNumber('');
      setScreenshot(null);
      setPreviewUrl('');
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit deposit');
    } finally {
      setLoading(false);
    }
  };

  const methodInfo = settings?.depositMethods?.[activeMethod] || {};

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--theme-bg)' }}>
      <Header />

      <main style={{ flex: 1, padding: '30px 20px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        
        {/* Page Title */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowDownCircle size={30} color="#10b981" />
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>
              Deposit Funds
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>
            Scan the official QR code or copy the account details, transfer the funds, then submit your transaction TID with screenshot proof.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '24px' }}>
          
          {/* Left Column: Method Selector & Large QR Code Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Method Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {/* EasyPaisa */}
              <div
                onClick={() => setActiveMethod('easypaisa')}
                style={{
                  padding: '16px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: activeMethod === 'easypaisa' ? '2px solid #10b981' : '1px solid var(--border)',
                  background: activeMethod === 'easypaisa' ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)' : 'rgba(255,255,255,0.04)',
                  boxShadow: activeMethod === 'easypaisa' ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#00aa4f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', color: '#fff', boxShadow: '0 4px 12px rgba(0, 170, 79, 0.4)' }}>
                  EP
                </div>
                <span style={{ fontSize: '14px', fontWeight: 900, color: activeMethod === 'easypaisa' ? '#34d399' : '#fff' }}>EasyPaisa</span>
              </div>

              {/* JazzCash */}
              <div
                onClick={() => setActiveMethod('jazzcash')}
                style={{
                  padding: '16px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: activeMethod === 'jazzcash' ? '2px solid #ef4444' : '1px solid var(--border)',
                  background: activeMethod === 'jazzcash' ? 'linear-gradient(145deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)' : 'rgba(255,255,255,0.04)',
                  boxShadow: activeMethod === 'jazzcash' ? '0 0 20px rgba(239, 68, 68, 0.3)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e40000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', color: '#fff', boxShadow: '0 4px 12px rgba(228, 0, 0, 0.4)' }}>
                  JC
                </div>
                <span style={{ fontSize: '14px', fontWeight: 900, color: activeMethod === 'jazzcash' ? '#f87171' : '#fff' }}>JazzCash</span>
              </div>

              {/* Bank Transfer */}
              <div
                onClick={() => setActiveMethod('bank')}
                style={{
                  padding: '16px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: activeMethod === 'bank' ? '2px solid #3b82f6' : '1px solid var(--border)',
                  background: activeMethod === 'bank' ? 'linear-gradient(145deg, rgba(59, 130, 246, 0.25) 0%, rgba(30, 64, 175, 0.15) 100%)' : 'rgba(255,255,255,0.04)',
                  boxShadow: activeMethod === 'bank' ? '0 0 20px rgba(59, 130, 246, 0.3)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '20px', color: '#fff', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.4)' }}>
                  🏦
                </div>
                <span style={{ fontSize: '14px', fontWeight: 900, color: activeMethod === 'bank' ? '#60a5fa' : '#fff' }}>Bank Transfer</span>
              </div>
            </div>

            {/* Method Details & LARGE QR CODE CARD */}
            <div className="glass-card-glow" style={{ padding: '26px', background: 'rgba(24, 8, 16, 0.92)' }}>
              
              {/* Header Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fbbf24', fontWeight: 800 }}>
                    Official Payment Channel
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {activeMethod} Deposit Gateway
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '4px 10px', borderRadius: '8px', color: '#34d399', fontSize: '11px', fontWeight: 800 }}>
                  <ShieldCheck size={14} /> Instant Verification
                </div>
              </div>

              {/* Large QR Display & Account Details Side-by-Side */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '22px' }}>
                
                {/* LARGE & ULTRA-CLEAR QR CODE CARD */}
                <div
                  style={{
                    width: '260px',
                    height: '260px',
                    borderRadius: '16px',
                    background: '#ffffff',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(239, 68, 68, 0.25)',
                    border: '3px solid #ffd700',
                    position: 'relative'
                  }}
                >
                  {methodInfo.qrCode ? (
                    <img 
                      src={methodInfo.qrCode} 
                      alt={`${activeMethod} QR Code`} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: '#000' }}>
                      <QrCode size={160} color="#0d040a" strokeWidth={2.2} />
                      <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 900, color: '#0d040a', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Scan in {activeMethod} App
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Details Box with High-Visibility Bright Fonts */}
                <div 
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '14px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    padding: '18px 20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {activeMethod === 'bank' && methodInfo.bankName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Bank Name:</span>
                      <strong style={{ fontSize: '16px', color: '#60a5fa', fontWeight: 900 }}>{methodInfo.bankName}</strong>
                    </div>
                  )}

                  {/* Account / Phone Number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block' }}>
                        Account / Mobile Number:
                      </span>
                      <span className="font-game" style={{ fontSize: '24px', fontWeight: 900, color: '#fbbf24', letterSpacing: '1px', textShadow: '0 0 10px rgba(251, 191, 36, 0.4)' }}>
                        {methodInfo.accountNumber || '03001234567'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(methodInfo.accountNumber || '03001234567', 'Account Number')}
                      className="btn btn-bet"
                      style={{ padding: '6px 14px', fontSize: '12px', height: '34px' }}
                    >
                      <Copy size={14} /> Copy
                    </button>
                  </div>

                  {/* Account Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Account Title:</span>
                    <strong style={{ fontSize: '16px', color: '#ffffff', fontWeight: 800 }}>
                      {methodInfo.accountTitle || '1play Official'}
                    </strong>
                  </div>
                </div>

              </div>

              {/* Instructions */}
              <div 
                style={{ 
                  marginTop: '18px', 
                  padding: '14px 16px', 
                  borderRadius: '10px', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  fontSize: '13px', 
                  color: '#ffffff',
                  lineHeight: 1.6
                }}
              >
                <div style={{ color: '#fbbf24', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} /> Easy Steps to Deposit:
                </div>
                {methodInfo.instructions || (
                  <ol style={{ paddingLeft: '18px', margin: 0 }}>
                    <li>Open your <strong>{activeMethod.toUpperCase()}</strong> application.</li>
                    <li>Scan the <strong>large QR code above</strong> or transfer to the account number.</li>
                    <li>Copy the <strong>TID (Transaction ID)</strong> from your app receipt.</li>
                    <li>Take a screenshot of the successful receipt and submit the form on the right.</li>
                  </ol>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Deposit Submission Form */}
          <div className="glass-card-glow" style={{ padding: '26px', background: 'rgba(24, 8, 16, 0.92)' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>
                Submit Payment Receipt
              </h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
                Enter TID and upload payment screenshot for instant credit
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                  Deposit Amount (PKR) *
                </label>
                <input
                  type="number"
                  placeholder="Min 100 PKR"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'var(--font-game)', color: '#34d399' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                  Transaction ID (TID) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2398471928"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                  style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  Sender Mobile / Account Number
                </label>
                <input
                  type="text"
                  placeholder="Your mobile account number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              {/* Screenshot Upload Box */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '6px' }}>
                  Payment Proof Screenshot *
                </label>
                <div
                  style={{
                    border: '2px dashed rgba(239, 68, 68, 0.4)',
                    borderRadius: '10px',
                    padding: '18px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(0,0,0,0.3)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onClick={() => document.getElementById('screenshot-input').click()}
                >
                  <input
                    id="screenshot-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {previewUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <img src={previewUrl} alt="Receipt Preview" style={{ maxHeight: '140px', borderRadius: '8px', border: '1px solid #10b981' }} />
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>✓ Screenshot selected (click to change)</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Upload size={28} color="#ef4444" />
                      <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 700 }}>
                        Click to upload payment screenshot
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        PNG, JPG, JPEG (Max 10MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-bet"
                style={{ height: '48px', fontSize: '16px', fontWeight: 800, marginTop: '8px', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)' }}
              >
                <CheckCircle2 size={18} />
                {loading ? 'Submitting Request...' : 'Submit Deposit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Deposit History Table */}
        <div className="glass-card" style={{ marginTop: '32px', padding: '24px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#fff', marginBottom: '16px' }}>
            My Deposit History
          </h3>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              No deposit requests submitted yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Method</th>
                    <th style={{ padding: '10px' }}>TID</th>
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
                      <td style={{ padding: '12px 10px', textTransform: 'uppercase', fontWeight: 800, color: '#fff' }}>
                        {tx.method}
                      </td>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#fbbf24' }}>
                        {tx.transactionId}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 900, color: '#10b981' }} className="font-game">
                        {formatAmount(tx.amount)}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            background: tx.status === 'approved' ? 'rgba(16, 185, 129, 0.25)' : tx.status === 'rejected' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
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

export default DepositPage;
