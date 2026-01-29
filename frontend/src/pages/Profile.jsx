import { useState, useEffect } from 'react';
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
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // General error/success state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.name || '');
      setLanguage(currentUser.language || 'en');
      setTimezone(currentUser.timezone || 'UTC');
    }
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [currentUser]);

  // Sync local state when currentUser changes (e.g., after updates)
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.name || '');
      setLanguage(currentUser.language || 'en');
      setTimezone(currentUser.timezone || 'UTC');
    }
  }, [currentUser.name, currentUser.language, currentUser.timezone, currentUser.avatar_url]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    
    try {
      setError('');
      const result = await auth.updateProfile({ name: displayName.trim() });
      setIsEditing(false);
      setSuccess('Name updated successfully');
      
      // Update parent component with fresh user data
      if (onUserUpdate) {
        onUserUpdate(result.user);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update name');
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(currentUser?.name || '');
    setIsEditing(false);
    setError('');
  };

  const handleLanguageChange = async (newLanguage) => {
    try {
      setError('');
      const result = await auth.updateProfile({ language: newLanguage });
      setLanguage(newLanguage);
      setSuccess('Language updated successfully');
      
      // Update parent component with fresh user data
      if (onUserUpdate) {
        onUserUpdate(result.user);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update language');
    }
  };

  const handleTimezoneChange = async (newTimezone) => {
    try {
      setError('');
      const result = await auth.updateProfile({ timezone: newTimezone });
      setTimezone(newTimezone);
      setSuccess('Timezone updated successfully');
      
      // Update parent component with fresh user data
      if (onUserUpdate) {
        onUserUpdate(result.user);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update timezone');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be smaller than 2MB');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const result = await auth.uploadAvatar(formData);
      setSuccess('Avatar updated successfully');
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Update parent component with fresh user data
      if (onUserUpdate) {
        onUserUpdate(result.user);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
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

  const handleExportData = async () => {
    try {
      setError('');
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

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const isGoogleUser = currentUser?.authProvider === 'google';

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Profile</h1>
      </div>

      <div style={styles.profileContainer}>
        {/* Profile Header - Identity */}
        <div className="card">
          <div className="card-content">
            <div style={styles.profileHeader}>
              <div style={styles.avatarSection}>
                <div style={styles.avatar}>
                  {currentUser?.avatar_url ? (
                    <img 
                      src={currentUser.avatar_url} 
                      alt="Avatar" 
                      style={styles.avatarImage}
                    />
                  ) : avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar preview" 
                      style={styles.avatarImage}
                    />
                  ) : (
                    getInitials(currentUser?.name)
                  )}
                </div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={styles.hiddenInput}
                />
                {avatarFile ? (
                  <div style={styles.avatarActions}>
                    <button 
                      onClick={handleAvatarUpload}
                      className="btn btn-primary"
                      style={styles.uploadButton}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button 
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                      className="btn btn-secondary"
                      style={styles.cancelAvatarButton}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => document.getElementById('avatar-upload').click()}
                    className="btn btn-secondary"
                    style={styles.changeAvatarButton}
                  >
                    Change Avatar
                  </button>
                )}
              </div>
              
              <div style={styles.profileInfo}>
                <div style={styles.nameSection}>
                  {isEditing ? (
                    <div style={styles.editingContainer}>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="form-input"
                        style={styles.nameInput}
                        placeholder="Enter your name"
                      />
                      <div style={styles.editActions}>
                        <button 
                          onClick={handleSaveDisplayName}
                          className="btn btn-primary"
                          style={styles.saveButton}
                        >
                          Save
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="btn btn-secondary"
                          style={styles.cancelButton}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.nameDisplay}>
                      <h2 style={styles.displayName}>{displayName || 'No name set'}</h2>
                      <button 
                        onClick={() => setIsEditing(true)}
                        style={styles.editButton}
                        className="profile-edit-button"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                
                <div style={styles.emailSection}>
                  <span style={styles.email}>{currentUser?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Preferences</h3>
          </div>
          <div className="card-content">
            <div style={styles.preferencesGrid} className="profile-preferences-grid">
              <div style={styles.preferenceItem}>
                <label style={styles.preferenceLabel}>Language</label>
                <select 
                  style={styles.preferenceSelect} 
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
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
              
              <div style={styles.preferenceItem}>
                <label style={styles.preferenceLabel}>Timezone</label>
                <select 
                  style={styles.preferenceSelect} 
                  value={timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
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
        </div>

        {/* Account */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account</h3>
          </div>
          <div className="card-content">
            <div style={styles.accountContainer}>
              <div style={styles.accountItem}>
                <div style={styles.accountInfo}>
                  <span style={styles.accountLabel}>Password</span>
                  {isGoogleUser ? (
                    <span style={styles.accountNote}>Managed by Google</span>
                  ) : (
                    <span style={styles.accountDescription}>Change your account password</span>
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

              <div style={styles.accountItem}>
                <div style={styles.accountInfo}>
                  <span style={styles.accountLabel}>Connected Account</span>
                  <span style={styles.accountValue}>
                    {isGoogleUser ? 'Google' : 'Email'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Privacy</h3>
          </div>
          <div className="card-content">
            <div style={styles.privacyContainer}>
              <p style={styles.privacyNote}>
                Your artwork and reflections belong to you.
              </p>
              
              <div style={styles.privacyActions}>
                <div style={styles.privacyItem}>
                  <div style={styles.privacyInfo}>
                    <span style={styles.privacyLabel}>Download my data</span>
                    <span style={styles.privacyDescription}>Export all your data</span>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleExportData}
                  >
                    Download
                  </button>
                </div>

                <div style={styles.privacyItem}>
                  <div style={styles.privacyInfo}>
                    <span style={styles.privacyLabel}>Delete my account</span>
                    <span style={styles.privacyDescription}>Permanently delete your account and data</span>
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
            </div>
          </div>
        </div>

        {/* Logout */}
        <div style={styles.logoutSection}>
          <button 
            onClick={handleLogout}
            className="btn btn-primary"
            style={styles.logoutButton}
          >
            Sign Out
          </button>
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
                  style={styles.cancelButton}
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
    </div>
  );
};

const styles = {
  profileContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
    maxWidth: '600px',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-6)',
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexShrink: 0,
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'var(--color-gray-200)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-700)',
  },
  changeAvatarButton: {
    fontSize: 'var(--font-size-xs)',
    padding: 'var(--space-1) var(--space-2)',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameSection: {
    marginBottom: 'var(--space-3)',
  },
  nameDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  displayName: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-900)',
    margin: 0,
  },
  editButton: {
    background: 'none',
    border: '1px solid var(--color-gray-300)',
    color: 'var(--color-gray-600)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    cursor: 'pointer',
    transition: 'all var(--transition-normal)',
  },
  editingContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  nameInput: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    padding: 'var(--space-3)',
  },
  editActions: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
  saveButton: {
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--font-size-sm)',
  },
  cancelButton: {
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--font-size-sm)',
  },
  emailSection: {
    marginBottom: 'var(--space-2)',
  },
  email: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-600)',
  },
  preferencesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-6)',
  },
  preferenceItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  preferenceLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-700)',
  },
  preferenceSelect: {
    padding: 'var(--space-3)',
    border: '1px solid var(--color-gray-300)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-base)',
    background: 'var(--color-white)',
    color: 'var(--color-gray-900)',
    cursor: 'pointer',
  },
  accountContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  accountItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-4) 0',
    borderBottom: '1px solid var(--color-gray-200)',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  accountLabel: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-900)',
  },
  accountDescription: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-500)',
  },
  accountNote: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-400)',
    fontStyle: 'italic',
  },
  accountValue: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-600)',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  privacyContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  privacyNote: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-600)',
    margin: 0,
    padding: 'var(--space-4)',
    background: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-gray-200)',
  },
  privacyActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  privacyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-4) 0',
    borderBottom: '1px solid var(--color-gray-200)',
  },
  privacyInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  privacyLabel: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-900)',
  },
  privacyDescription: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-500)',
  },
  deleteButton: {
    color: 'var(--color-error)',
    borderColor: 'var(--color-error)',
  },
  logoutSection: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 'var(--space-8)',
    borderTop: '1px solid var(--color-gray-200)',
  },
  logoutButton: {
    padding: 'var(--space-3) var(--space-8)',
    fontSize: 'var(--font-size-base)',
  },
  hiddenInput: {
    display: 'none',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
  },
  avatarActions: {
    display: 'flex',
    gap: 'var(--space-2)',
    flexDirection: 'column',
  },
  uploadButton: {
    fontSize: 'var(--font-size-xs)',
    padding: 'var(--space-1) var(--space-2)',
  },
  cancelAvatarButton: {
    fontSize: 'var(--font-size-xs)',
    padding: 'var(--space-1) var(--space-2)',
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
  cancelButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
  confirmButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
};

export default Profile;