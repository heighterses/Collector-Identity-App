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
        <p className="dashboard-subtitle">Manage your identity and personal information</p>
      </div>

      <div style={styles.profileContainer}>
        {/* Profile Header - Identity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Identity</h3>
          </div>
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
                  <span style={styles.authProvider}>
                    {currentUser?.auth_provider === 'google' ? 'Google Account' : 'Email Account'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Localization Preferences */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Localization</h3>
          </div>
          <div className="card-content">
            <div style={styles.preferencesGrid}>
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
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
  },
  changeAvatarButton: {
    fontSize: 'var(--font-size-xs)',
    padding: 'var(--space-1) var(--space-2)',
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
  hiddenInput: {
    display: 'none',
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
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  email: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-600)',
  },
  authProvider: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-500)',
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
};

export default Profile;