import { useState, useEffect } from 'react';

const Profile = ({ currentUser, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.name || '');
    }
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [currentUser]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSaveDisplayName = () => {
    // In a real app, this would save to backend
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setDisplayName(currentUser?.name || '');
    setIsEditing(false);
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
                  {getInitials(currentUser?.name)}
                </div>
                <button 
                  className="btn btn-secondary"
                  style={styles.changeAvatarButton}
                  disabled
                >
                  Change Avatar
                </button>
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
                <select style={styles.preferenceSelect} disabled>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
              
              <div style={styles.preferenceItem}>
                <label style={styles.preferenceLabel}>Timezone</label>
                <select style={styles.preferenceSelect} disabled>
                  <option>Auto-detect</option>
                  <option>Pacific Time (PT)</option>
                  <option>Eastern Time (ET)</option>
                  <option>Central Time (CT)</option>
                  <option>Mountain Time (MT)</option>
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
                  style={isGoogleUser ? styles.disabledButton : {}}
                >
                  Change Password
                </button>
              </div>

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
                  <button className="btn btn-secondary" disabled>
                    Download
                  </button>
                </div>

                <div style={styles.privacyItem}>
                  <div style={styles.privacyInfo}>
                    <span style={styles.privacyLabel}>Delete my account</span>
                    <span style={styles.privacyDescription}>Permanently delete your account and data</span>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    disabled
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
    opacity: 0.5,
    cursor: 'not-allowed',
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
    background: 'var(--color-gray-50)',
    color: 'var(--color-gray-500)',
    cursor: 'not-allowed',
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
    opacity: 0.5,
    cursor: 'not-allowed',
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
};

export default Profile;