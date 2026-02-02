import React, { useState, useEffect } from 'react';
import { auth } from '../api.js';

const Settings = ({ currentUser, onLogout, onUserUpdate }) => {
  const [activeSection, setActiveSection] = useState('account');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Preferences state
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'private',
    data_sharing: false,
    analytics: true
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: false,
    marketing_emails: false
  });
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on component mount
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
    
    // Load user preferences
    if (currentUser) {
      if (currentUser.privacy_settings) {
        setPrivacySettings(currentUser.privacy_settings);
      }
      if (currentUser.notification_settings) {
        setNotificationSettings(currentUser.notification_settings);
      }
    }
  }, [currentUser]);

  const applyTheme = (selectedTheme) => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      await auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordSuccess('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePrivacyChange = async (key, value) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    
    try {
      setError('');
      const result = await auth.updatePreferences({ privacy_settings: newSettings });
      setSuccess('Privacy settings updated');
      
      if (onUserUpdate) {
        onUserUpdate(result.user);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update privacy settings');
      // Revert on error
      setPrivacySettings(privacySettings);
    }
  };

  const handleNotificationChange = async (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    
    try {
      setError('');
      const result = await auth.updatePreferences({ notification_settings: newSettings });
      setSuccess('Notification settings updated');
      
      if (onUserUpdate) {
        onUserUpdate(result.user);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update notification settings');
      // Revert on error
      setNotificationSettings(notificationSettings);
    }
  };

  const handleExportData = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await auth.exportData();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collector-identity-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setError('');
    
    try {
      await auth.deleteAccount();
      // Logout and redirect will be handled by the parent component
      onLogout();
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const isGoogleUser = currentUser?.auth_provider === 'google';

  const settingSections = [
    { id: 'account', label: 'Account & Security', icon: '🔐' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  ];

  const renderAccountSection = () => (
    <div style={styles.sectionContent}>
      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Password</span>
          {isGoogleUser ? (
            <span style={styles.settingNote}>Managed by Google</span>
          ) : (
            <span style={styles.settingDescription}>Change your account password</span>
          )}
        </div>
        <button 
          className="btn btn-secondary" 
          disabled={isGoogleUser}
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          style={isGoogleUser ? styles.disabledButton : {}}
        >
          Change Password
        </button>
      </div>

      {showPasswordForm && !isGoogleUser && (
        <form onSubmit={handlePasswordChange} style={styles.passwordForm}>
          <div style={styles.passwordField}>
            <label style={styles.passwordLabel}>Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              className="form-input"
              required
            />
          </div>
          <div style={styles.passwordField}>
            <label style={styles.passwordLabel}>New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="form-input"
              required
              minLength={8}
            />
          </div>
          <div style={styles.passwordField}>
            <label style={styles.passwordLabel}>Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="form-input"
              required
            />
          </div>
          {passwordError && (
            <div style={styles.passwordError}>{passwordError}</div>
          )}
          {passwordSuccess && (
            <div style={styles.passwordSuccess}>{passwordSuccess}</div>
          )}
          <div style={styles.passwordActions}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setShowPasswordForm(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
                setPasswordSuccess('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Connected Account</span>
          <span style={styles.settingValue}>
            {isGoogleUser ? 'Google' : 'Email'}
          </span>
        </div>
      </div>

      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Export Data</span>
          <span style={styles.settingDescription}>Download all your data</span>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={handleExportData}
          disabled={loading}
        >
          {loading ? 'Exporting...' : 'Download'}
        </button>
      </div>

      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Delete Account</span>
          <span style={styles.settingDescription}>Permanently delete your account and data</span>
        </div>
        <button 
          className="btn btn-danger" 
          onClick={() => setShowDeleteConfirm(true)}
          style={styles.deleteButton}
        >
          Delete Account
        </button>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div style={styles.sectionContent}>
      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Profile Visibility</span>
          <span style={styles.settingDescription}>Control who can see your profile</span>
        </div>
        <select 
          value={privacySettings.profile_visibility}
          onChange={(e) => handlePrivacyChange('profile_visibility', e.target.value)}
          style={styles.settingSelect}
        >
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
      </div>

      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Data Sharing</span>
          <span style={styles.settingDescription}>Allow sharing anonymized data for research</span>
        </div>
        <label style={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={privacySettings.data_sharing}
            onChange={(e) => handlePrivacyChange('data_sharing', e.target.checked)}
          />
          <span style={styles.toggleSlider}></span>
        </label>
      </div>

      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Analytics</span>
          <span style={styles.settingDescription}>Help improve the app with usage analytics</span>
        </div>
        <label style={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={privacySettings.analytics}
            onChange={(e) => handlePrivacyChange('analytics', e.target.checked)}
          />
          <span style={styles.toggleSlider}></span>
        </label>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div style={styles.sectionContent}>
      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Email Notifications</span>
          <span style={styles.settingDescription}>Receive important updates via email</span>
        </div>
        <label style={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={notificationSettings.email_notifications}
            onChange={(e) => handleNotificationChange('email_notifications', e.target.checked)}
          />
          <span style={styles.toggleSlider}></span>
        </label>
      </div>

      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Push Notifications</span>
          <span style={styles.settingDescription}>Receive push notifications in your browser</span>
        </div>
        <label style={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={notificationSettings.push_notifications}
            onChange={(e) => handleNotificationChange('push_notifications', e.target.checked)}
          />
          <span style={styles.toggleSlider}></span>
        </label>
      </div>

      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Marketing Emails</span>
          <span style={styles.settingDescription}>Receive promotional emails and updates</span>
        </div>
        <label style={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={notificationSettings.marketing_emails}
            onChange={(e) => handleNotificationChange('marketing_emails', e.target.checked)}
          />
          <span style={styles.toggleSlider}></span>
        </label>
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div style={styles.sectionContent}>
      <div style={styles.settingItem}>
        <div style={styles.settingInfo}>
          <span style={styles.settingLabel}>Theme</span>
          <span style={styles.settingDescription}>Choose your preferred theme</span>
        </div>
        <select 
          value={theme}
          onChange={handleThemeChange}
          style={styles.settingSelect}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'account':
        return renderAccountSection();
      case 'privacy':
        return renderPrivacySection();
      case 'notifications':
        return renderNotificationsSection();
      case 'preferences':
        return renderPreferencesSection();
      default:
        return renderAccountSection();
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Settings</h1>
        <p className="dashboard-subtitle">Manage your account and preferences</p>
      </div>

      <div style={styles.settingsLayout}>
        {/* Settings Navigation */}
        <nav style={styles.settingsNav}>
          {settingSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`btn ${activeSection === section.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                ...styles.navButton,
                ...(activeSection === section.id ? styles.activeNavButton : {})
              }}
            >
              <span style={styles.navIcon}>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        {/* Settings Content */}
        <div style={styles.settingsContent}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                {settingSections.find(s => s.id === activeSection)?.label}
              </h3>
            </div>
            <div className="card-content">
              {renderActiveSection()}
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}
      {success && (
        <div style={styles.successMessage}>
          {success}
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalBackdrop} onClick={() => setShowDeleteConfirm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Delete Account</h3>
            </div>
            <div style={styles.modalContent}>
              <p style={styles.modalMessage}>
                Are you sure you want to permanently delete your account? This will remove:
              </p>
              <ul style={styles.deleteList}>
                <li>Your profile and settings</li>
                <li>All uploaded artworks</li>
                <li>All generated reflections</li>
                <li>All stored media files</li>
              </ul>
              <p style={styles.modalWarning}>
                This action cannot be undone.
              </p>
            </div>
            <div style={styles.modalActions}>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
                style={styles.modalCancelButton}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="btn btn-danger"
                style={styles.confirmButton}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  settingsLayout: {
    display: 'grid',
    gridTemplateColumns: '250px 1fr',
    gap: 'var(--space-6)',
    alignItems: 'start',
  },
  settingsNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    textAlign: 'left',
    justifyContent: 'flex-start',
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-normal)',
  },
  activeNavButton: {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-white)',
  },
  navIcon: {
    fontSize: 'var(--font-size-lg)',
  },
  settingsContent: {
    minHeight: '400px',
  },
  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-4) 0',
    borderBottom: '1px solid var(--color-gray-200)',
  },
  settingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    flex: 1,
  },
  settingLabel: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-900)',
  },
  settingDescription: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-500)',
  },
  settingNote: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-400)',
    fontStyle: 'italic',
  },
  settingValue: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-600)',
  },
  settingSelect: {
    padding: 'var(--space-2) var(--space-3)',
    border: '1px solid var(--color-gray-300)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    background: 'var(--color-white)',
    cursor: 'pointer',
  },
  toggleSwitch: {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '24px',
  },
  toggleSlider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--color-gray-300)',
    transition: 'var(--transition-normal)',
    borderRadius: '24px',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  deleteButton: {
    color: 'var(--color-error)',
    borderColor: 'var(--color-error)',
  },
  passwordForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    padding: 'var(--space-4)',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-gray-200)',
    marginTop: 'var(--space-4)',
  },
  passwordField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  passwordLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-700)',
  },
  passwordActions: {
    display: 'flex',
    gap: 'var(--space-3)',
    justifyContent: 'flex-end',
  },
  passwordError: {
    color: 'var(--color-error)',
    fontSize: 'var(--font-size-sm)',
    padding: 'var(--space-2)',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(220, 38, 38, 0.2)',
  },
  passwordSuccess: {
    color: 'var(--color-success)',
    fontSize: 'var(--font-size-sm)',
    padding: 'var(--space-2)',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(22, 163, 74, 0.2)',
  },
  errorMessage: {
    color: 'var(--color-error)',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'center',
    padding: 'var(--space-4)',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(220, 38, 38, 0.2)',
    marginTop: 'var(--space-4)',
  },
  successMessage: {
    color: 'var(--color-success)',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'center',
    padding: 'var(--space-4)',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(22, 163, 74, 0.2)',
    marginTop: 'var(--space-4)',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
  },
  modal: {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '500px',
    boxShadow: 'var(--shadow-xl)',
    animation: 'modalSlideIn 0.2s ease-out',
  },
  modalHeader: {
    padding: 'var(--space-6) var(--space-6) var(--space-4) var(--space-6)',
    borderBottom: '1px solid var(--color-gray-200)',
  },
  modalTitle: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-900)',
    margin: 0,
  },
  modalContent: {
    padding: 'var(--space-6)',
  },
  modalMessage: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-700)',
    lineHeight: 'var(--line-height-relaxed)',
    margin: '0 0 var(--space-4) 0',
  },
  deleteList: {
    margin: '0 0 var(--space-4) var(--space-4)',
    color: 'var(--color-gray-600)',
    fontSize: 'var(--font-size-sm)',
  },
  modalWarning: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-error)',
    fontWeight: 'var(--font-weight-medium)',
    margin: 0,
  },
  modalActions: {
    display: 'flex',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-6) var(--space-6) var(--space-6)',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
  confirmButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
};

export default Settings;