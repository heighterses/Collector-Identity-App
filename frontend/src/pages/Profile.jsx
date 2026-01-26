import { useState } from 'react';

const Profile = ({ currentUser, onLogout }) => {
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [isEditing, setIsEditing] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSaveDisplayName = () => {
    // UI only - no backend logic
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setDisplayName(currentUser?.name || '');
    setIsEditing(false);
  };

  const isGoogleUser = currentUser?.authProvider === 'google';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Profile</h1>
        <p className="dashboard-subtitle">Manage your account settings</p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        
        {/* Profile Header */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Profile</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--color-gray-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-gray-700)'
            }}>
              {getInitials(currentUser?.name)}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-gray-700)',
                  marginBottom: 'var(--space-2)'
                }}>
                  Display Name
                </label>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Enter your display name"
                    />
                    <button
                      onClick={handleSaveDisplayName}
                      className="btn btn-primary"
                      style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-sm)' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn btn-secondary"
                      style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-sm)' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-gray-800)'
                    }}>
                      {displayName || 'Add your name'}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'all var(--transition-normal)'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-gray-700)',
                  marginBottom: 'var(--space-2)'
                }}>
                  Email Address
                </label>
                <span style={{
                  fontSize: 'var(--font-size-base)',
                  color: 'var(--color-gray-600)'
                }}>
                  {currentUser?.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Preferences */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Preferences</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--space-2)'
              }}>
                Language
              </label>
              <select
                disabled
                className="form-input"
                style={{
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  backgroundColor: 'var(--color-gray-50)'
                }}
              >
                <option>English (US)</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-gray-700)',
                marginBottom: 'var(--space-2)'
              }}>
                Timezone
              </label>
              <select
                disabled
                className="form-input"
                style={{
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  backgroundColor: 'var(--color-gray-50)'
                }}
              >
                <option>Automatic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <button
              disabled={isGoogleUser}
              className="btn btn-secondary"
              style={{
                justifyContent: 'flex-start',
                opacity: isGoogleUser ? 0.6 : 1,
                cursor: isGoogleUser ? 'not-allowed' : 'pointer'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 'var(--space-3)' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Change Password
              {isGoogleUser && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-gray-500)'
                }}>
                  Not available for Google accounts
                </span>
              )}
            </button>
            
            <div style={{
              borderTop: '1px solid var(--color-gray-200)',
              paddingTop: 'var(--space-4)',
              marginTop: 'var(--space-2)'
            }}>
              <button
                onClick={onLogout}
                className="btn btn-primary"
                style={{
                  justifyContent: 'flex-start',
                  width: '100%'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 'var(--space-3)' }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16,17 21,12 16,7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;