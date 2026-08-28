import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header/Header';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { 
  User as UserIcon, 
  Camera, 
  KeyRound, 
  Bell, 
  ShieldCheck, 
  Check, 
  Save, 
  Lock,
  Mail
} from 'lucide-react';

const AccountPage = () => {
  const { user, updateUserProfile, fetchMe } = useAuth();

  // Profile fields
  const [username, setUsername] = useState(user?.username || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState(user?.notifications || []);

  // Avatar Cropper State
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setNotifications(user.notifications || []);
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put('/user/profile', {
        username,
        firstName,
        lastName,
        email
      });
      toast.success('Profile updated successfully!');
      updateUserProfile(res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPwLoading(true);
    try {
      await api.post('/user/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  // Image Cropping Logic
  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setCropperOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const image = new Image();
      image.src = imageSrc;
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg');
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSaveCroppedAvatar = async () => {
    try {
      setAvatarUploading(true);
      const croppedBlob = await createCroppedImage();
      if (!croppedBlob) {
        toast.error('Error cropping image');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');

      const res = await api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Avatar updated successfully!');
      updateUserProfile(res.data.user);
      setCropperOpen(false);
      setImageSrc(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await api.put(`/user/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--theme-bg)' }}>
      <Header />

      <main style={{ flex: 1, padding: '30px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>
            Account Settings
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
            Manage your personal profile, permanent player ID, avatar, and security.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Left Column: Avatar & Profile Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Avatar & Permanent ID Card */}
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 16px' }}>
                {user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #e02424' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e02424 0%, #770b17 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                      fontWeight: 800,
                      color: '#fff'
                    }}
                  >
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}

                <label
                  htmlFor="avatar-upload"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}
                  title="Upload and Crop Profile Picture"
                >
                  <Camera size={16} color="#fff" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                {user?.username}
              </div>

              {/* Permanent ID Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  marginTop: '8px'
                }}
              >
                <ShieldCheck size={14} color="#10b981" />
                <span className="font-game" style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                  Permanent ID: {user?.idNumber}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                (This ID is permanent and securely registered to your account)
              </p>
            </div>

            {/* Profile Form */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
                Personal Information
              </h3>

              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="btn btn-bet"
                  style={{ height: '42px', marginTop: '6px' }}
                >
                  <Save size={16} />
                  {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Security & Notifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Password Change Card */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color="#ef4444" />
                Change Password
              </h3>

              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="btn btn-secondary"
                  style={{ height: '42px', marginTop: '6px' }}
                >
                  <Lock size={16} />
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Admin Notifications Inbox */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={18} color="#f59e0b" />
                  Notifications
                </h3>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                  {notifications.filter(n => !n.read).length} unread
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => !notif.read && markNotificationRead(notif._id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: notif.read ? 'rgba(255,255,255,0.03)' : 'rgba(245, 158, 11, 0.1)',
                        borderLeft: notif.read ? '3px solid rgba(255,255,255,0.2)' : '3px solid #f59e0b',
                        fontSize: '12px',
                        cursor: notif.read ? 'default' : 'pointer'
                      }}
                    >
                      <div style={{ color: '#fff' }}>{notif.message}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Avatar Crop Modal */}
        {cropperOpen && (
          <div className="modal-backdrop">
            <div
              className="glass-card"
              style={{
                width: '450px',
                height: '460px',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                position: 'relative'
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                Crop Profile Picture
              </h3>

              <div style={{ flex: 1, position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setCropperOpen(false);
                    setImageSrc(null);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCroppedAvatar}
                  disabled={avatarUploading}
                  className="btn btn-bet"
                  style={{ flex: 1 }}
                >
                  {avatarUploading ? 'Saving...' : 'Save Avatar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AccountPage;
