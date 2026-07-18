import React, { useState, useEffect } from 'react';
import { auth } from '../api.js';

const Toggle = ({ checked, onChange }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="toggle-track" />
  </label>
);

const Settings = ({ currentUser, onLogout, onUserUpdate }) => {
  const [activeSection, setActiveSection] = useState('account');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [privacySettings, setPrivacySettings] = useState({ profile_visibility: 'private', data_sharing: false, analytics: true });
  const [notificationSettings, setNotificationSettings] = useState({ email_notifications: true, push_notifications: false, marketing_emails: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved); applyTheme(saved);
    if (currentUser?.privacy_settings) setPrivacySettings(currentUser.privacy_settings);
    if (currentUser?.notification_settings) setNotificationSettings(currentUser.notification_settings);
  }, [currentUser]);

  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-mode', t === 'dark' ? 'dark' : 'light');
  };

  const notify = (msg, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleThemeChange = (val) => { setTheme(val); localStorage.setItem('theme', val); applyTheme(val); };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordError('Passwords do not match'); return; }
    if (passwordData.newPassword.length < 8) { setPasswordError('Password must be at least 8 characters'); return; }
    setPasswordLoading(true); setPasswordError('');
    try { await auth.changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }); setPasswordSuccess('Password updated'); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setShowPasswordForm(false); setTimeout(() => setPasswordSuccess(''), 3000); }
    catch (err) { setPasswordError(err.message || 'Failed to change password'); }
    finally { setPasswordLoading(false); }
  };

  const handlePrivacyChange = async (key, value) => {
    const next = { ...privacySettings, [key]: value }; setPrivacySettings(next);
    try { const r = await auth.updatePreferences({ privacy_settings: next }); notify('Privacy settings updated'); if (onUserUpdate) onUserUpdate(r.user); }
    catch (err) { notify(err.message || 'Failed to update', true); setPrivacySettings(privacySettings); }
  };

  const handleNotificationChange = async (key, value) => {
    const next = { ...notificationSettings, [key]: value }; setNotificationSettings(next);
    try { const r = await auth.updatePreferences({ notification_settings: next }); notify('Notification settings updated'); if (onUserUpdate) onUserUpdate(r.user); }
    catch (err) { notify(err.message || 'Failed to update', true); setNotificationSettings(notificationSettings); }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const data = await auth.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `collector-identity-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url); notify('Data exported');
    } catch (err) { notify(err.message || 'Failed to export', true); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try { await auth.deleteAccount(); onLogout(); }
    catch (err) { notify(err.message || 'Failed to delete account', true); setDeleteLoading(false); setShowDeleteConfirm(false); }
  };

  const isGoogleUser = currentUser?.auth_provider === 'google';

  const sections = [
    { id: 'account',       label: 'Account',       icon: '🔐' },
    { id: 'privacy',       label: 'Privacy',        icon: '🛡️' },
    { id: 'notifications', label: 'Notifications',  icon: '🔔' },
    { id: 'preferences',   label: 'Preferences',    icon: '⚙️' },
  ];

  const renderAccount = () => (
    <>
      <div className="setting-row">
        <div className="setting-row-info">
          <span className="setting-row-label">Password</span>
          {isGoogleUser ? <span className="setting-row-note">Managed by Google</span> : <span className="setting-row-desc">Change your account password</span>}
        </div>
        <button className="btn btn-secondary btn-sm" disabled={isGoogleUser} onClick={() => setShowPasswordForm(!showPasswordForm)}>Change</button>
      </div>
      {showPasswordForm && !isGoogleUser && (
        <form onSubmit={handlePasswordChange} className="password-form">
          {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
            <div className="form-group" key={field} style={{ marginBottom: 'var(--sp-4)' }}>
              <label className="form-label">{field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}</label>
              <input type="password" value={passwordData[field]} onChange={(e) => setPasswordData({ ...passwordData, [field]: e.target.value })} className="form-input" required minLength={field !== 'currentPassword' ? 8 : undefined} />
            </div>
          ))}
          {passwordError   && <div className="alert alert-error">{passwordError}</div>}
          {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
          <div className="password-form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={passwordLoading}>{passwordLoading ? 'Updating…' : 'Update password'}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowPasswordForm(false); setPasswordError(''); }}>Cancel</button>
          </div>
        </form>
      )}
      <div className="setting-row">
        <div className="setting-row-info"><span className="setting-row-label">Connected account</span><span className="setting-row-desc">{isGoogleUser ? 'Google' : 'Email & password'}</span></div>
      </div>
      <div className="setting-row">
        <div className="setting-row-info"><span className="setting-row-label">Export data</span><span className="setting-row-desc">Download all your data as JSON</span></div>
        <button className="btn btn-secondary btn-sm" onClick={handleExportData} disabled={loading}>{loading ? 'Exporting…' : 'Download'}</button>
      </div>
      <div className="setting-row">
        <div className="setting-row-info"><span className="setting-row-label" style={{ color: 'var(--error)' }}>Delete account</span><span className="setting-row-desc">Permanently remove your account and all data</span></div>
        <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
      </div>
    </>
  );

  const renderPrivacy = () => (
    <>
      <div className="setting-row">
        <div className="setting-row-info"><span className="setting-row-label">Profile visibility</span><span className="setting-row-desc">Control who can see your profile</span></div>
        <select className="settings-select" value={privacySettings.profile_visibility} onChange={(e) => handlePrivacyChange('profile_visibility', e.target.value)}>
          <option value="private">Private</option><option value="public">Public</option>
        </select>
      </div>
      <div className="setting-row">
        <div className="setting-row-info"><span className="setting-row-label">Data sharing</span><span className="setting-row-desc">Allow anonymized data for research</span></div>
        <Toggle checked={privacySettings.data_sharing} onChange={(v) => handlePrivacyChange('data_sharing', v)} />
      </div>
      <div className="setting-row">
        <div className="setting-row-info"><span className="setting-row-label">Analytics</span><span className="setting-row-desc">Help improve the app with usage analytics</span></div>
        <Toggle checked={privacySettings.analytics} onChange={(v) => handlePrivacyChange('analytics', v)} />
      </div>
    </>
  );

  const renderNotifications = () => (
    <>
      {[
        { key: 'email_notifications', label: 'Email notifications', desc: 'Receive important updates via email' },
        { key: 'push_notifications',  label: 'Push notifications',  desc: 'Receive push notifications in your browser' },
        { key: 'marketing_emails',    label: 'Marketing emails',    desc: 'Receive promotional emails and updates' },
      ].map(({ key, label, desc }) => (
        <div className="setting-row" key={key}>
          <div className="setting-row-info"><span className="setting-row-label">{label}</span><span className="setting-row-desc">{desc}</span></div>
          <Toggle checked={notificationSettings[key]} onChange={(v) => handleNotificationChange(key, v)} />
        </div>
      ))}
    </>
  );

  const renderPreferences = () => (
    <div className="setting-row">
      <div className="setting-row-info"><span className="setting-row-label">Theme</span><span className="setting-row-desc">Choose your preferred appearance</span></div>
      <select className="settings-select" value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
        <option value="light">Light</option><option value="dark">Dark</option>
      </select>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'account': return renderAccount();
      case 'privacy': return renderPrivacy();
      case 'notifications': return renderNotifications();
      case 'preferences': return renderPreferences();
      default: return renderAccount();
    }
  };

  return (
    <div className="gallery-settings" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
      <div className="gallery-settings-header">
        <h1 className="gallery-settings-title">Settings</h1>
        <p className="gallery-settings-sub">Manage your account and preferences</p>
      </div>

      <div className="gallery-settings-layout">
        <nav className="gallery-settings-nav">
          {sections.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={`gallery-settings-nav-btn${activeSection === s.id ? ' gallery-settings-nav-btn--active' : ''}`}>
              <span className="gallery-settings-nav-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="gallery-settings-content">
          <div className="gallery-settings-content-header">
            <h3 className="gallery-settings-content-title">{sections.find(s => s.id === activeSection)?.label}</h3>
          </div>
          <div className="gallery-settings-content-body">{renderContent()}</div>
        </div>
      </div>

      {error   && <div className="alert alert-error" style={{ marginTop: 'var(--sp-4)' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginTop: 'var(--sp-4)' }}>{success}</div>}

      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Delete Account</h3></div>
            <div className="modal-body">
              <p className="modal-message">Are you sure you want to permanently delete your account? This will remove all your artworks, reflections, and stored data.</p>
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary" disabled={deleteLoading}>Cancel</button>
              <button onClick={handleDeleteAccount} className="btn btn-danger" disabled={deleteLoading}>{deleteLoading ? 'Deleting…' : 'Delete account'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
