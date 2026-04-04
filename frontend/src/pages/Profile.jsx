import React, { useState, useEffect } from 'react';
import { auth } from '../api.js';

const Profile = ({ currentUser, onLogout, onUserUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser) { setDisplayName(currentUser.name || ''); setLanguage(currentUser.language || 'en'); setTimezone(currentUser.timezone || 'UTC'); }
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) { setDisplayName(currentUser.name || ''); setLanguage(currentUser.language || 'en'); setTimezone(currentUser.timezone || 'UTC'); }
  }, [currentUser?.name, currentUser?.language, currentUser?.timezone]);

  const getInitials = (name) => { if (!name) return 'U'; return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); };

  const notify = (msg, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) { notify('Name cannot be empty', true); return; }
    try { const r = await auth.updateProfile({ name: displayName.trim() }); setIsEditing(false); notify('Name updated'); if (onUserUpdate) onUserUpdate(r.user); }
    catch (err) { notify(err.message || 'Failed to update name', true); }
  };

  const handleLanguageChange = async (val) => {
    try { const r = await auth.updateProfile({ language: val }); setLanguage(val); notify('Language updated'); if (onUserUpdate) onUserUpdate(r.user); }
    catch (err) { notify(err.message || 'Failed to update language', true); }
  };

  const handleTimezoneChange = async (val) => {
    try { const r = await auth.updateProfile({ timezone: val }); setTimezone(val); notify('Timezone updated'); if (onUserUpdate) onUserUpdate(r.user); }
    catch (err) { notify(err.message || 'Failed to update timezone', true); }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { notify('Please select an image file', true); return; }
    if (file.size > 2 * 1024 * 1024) { notify('Image must be smaller than 2MB', true); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', avatarFile);
      const r = await auth.uploadAvatar(fd);
      console.log('Avatar upload response:', r);
      console.log('Saved avatar_url:', r.user?.avatar_url);
      notify('Photo updated');
      setAvatarFile(null);
      setAvatarPreview(null);
      if (onUserUpdate) onUserUpdate(r.user);
    }
    catch (err) { notify(err.message || 'Failed to upload photo', true); }
    finally { setIsUploading(false); }
  };

  if (loading) {
    return (
      <div className="gallery-profile">
        <div className="ghost-cards">
          <div className="ghost-card" style={{ height: 220 }} />
          <div className="ghost-card" style={{ height: 160 }} />
        </div>
      </div>
    );
  }

  // avatarPreview = local blob (just selected, not yet uploaded)
  // currentUser.avatar_url = /api/images/... proxy path (persisted)
  const avatarSrc = avatarPreview || currentUser?.avatar_url || null;

  return (
    <div className="gallery-profile">
      <div className="gallery-profile-header">
        <h1 className="gallery-profile-title">Profile</h1>
        <p className="gallery-profile-sub">Your identity and preferences</p>
      </div>

      {/* Identity card */}
      <div className="gallery-identity-card">
        <div className="gallery-identity-banner" />
        <div className="gallery-identity-body">
          <div className="gallery-avatar-row">
            <div className="gallery-avatar">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : null}
              {/* Initials shown when no avatar or image fails */}
              <span style={{
                position: avatarSrc ? 'absolute' : 'static',
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--white)',
              }}>
                {getInitials(currentUser?.name)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              {avatarFile ? (
                <>
                  <button onClick={handleAvatarUpload} className="btn btn-primary btn-sm" disabled={isUploading}>
                    {isUploading ? 'Uploading…' : 'Upload'}
                  </button>
                  <button onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} className="btn btn-secondary btn-sm">Cancel</button>
                </>
              ) : (
                <button onClick={() => document.getElementById('avatar-upload').click()} className="btn btn-secondary btn-sm">
                  Change photo
                </button>
              )}
              <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </div>
          </div>

          {isEditing ? (
            <div className="gallery-name-edit">
              <input
                type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="form-input" placeholder="Your name"
                style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}
              />
              <div className="gallery-name-edit-actions">
                <button onClick={handleSaveName} className="btn btn-primary btn-sm">Save</button>
                <button onClick={() => { setDisplayName(currentUser?.name || ''); setIsEditing(false); }} className="btn btn-secondary btn-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="gallery-name-row">
              <h2 className="gallery-display-name">{displayName || 'No name set'}</h2>
              <button onClick={() => setIsEditing(true)} className="btn btn-ghost btn-sm">Edit</button>
            </div>
          )}

          <p className="gallery-email">{currentUser?.email}</p>
          <span className="gallery-provider-badge">
            {currentUser?.auth_provider === 'google' ? 'Google Account' : 'Email Account'}
          </span>
        </div>
      </div>

      {/* Localization */}
      <div className="gallery-prefs-card">
        <div className="gallery-prefs-header">
          <h3 className="gallery-prefs-label">Localization</h3>
        </div>
        <div className="gallery-prefs-body">
          <div className="pref-item">
            <label className="pref-label">Language</label>
            <select className="form-input" value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="zh">中文</option>
            </select>
          </div>
          <div className="pref-item">
            <label className="pref-label">Timezone</label>
            <select className="form-input" value={timezone} onChange={(e) => handleTimezoneChange(e.target.value)}>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Europe/Berlin">Berlin (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
              <option value="Asia/Seoul">Seoul (KST)</option>
              <option value="Australia/Sydney">Sydney (AEDT)</option>
            </select>
          </div>
        </div>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
    </div>
  );
};

export default Profile;
