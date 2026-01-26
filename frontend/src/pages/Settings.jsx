import { useState } from 'react';

const Settings = ({ currentUser }) => {
  const [activeSection, setActiveSection] = useState('account');

  const settingSections = [
    { id: 'account', label: 'Account', icon: 'user' },
    { id: 'preferences', label: 'Preferences', icon: 'settings' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Settings</h1>
        <p className="dashboard-subtitle">Manage your account and preferences</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '240px 1fr', 
        gap: 'var(--space-8)',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* Settings Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {settingSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`nav-item ${activeSection === section.id ? 'nav-item--active' : ''}`}
              style={{ 
                justifyContent: 'flex-start',
                padding: 'var(--space-3) var(--space-4)'
              }}
            >
              <span className="nav-icon">
                {section.icon === 'user' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
                {section.icon === 'settings' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17-4a4 4 0 0 1-8 0 4 4 0 0 1 8 0zM7 17a4 4 0 0 1-8 0 4 4 0 0 1 8 0z"></path>
                  </svg>
                )}
              </span>
              <span className="nav-label">{section.label}</span>
            </button>
          ))}
        </nav>

        {/* Settings Content */}
        <div className="card">
          {activeSection === 'account' && (
            <div>
              <div className="card-header">
                <h2 className="card-title">Account & Security</h2>
              </div>
              
              <div style={{ marginBottom: 'var(--space-8)' }}>
                <h3 style={{ 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-gray-800)',
                  marginBottom: 'var(--space-4)'
                }}>
                  Personal Information
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingBottom: 'var(--space-4)',
                    borderBottom: '1px solid var(--color-gray-200)'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-gray-800)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        Full Name
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-gray-600)'
                      }}>
                        {currentUser?.name}
                      </div>
                    </div>
                    <button className="btn btn-ghost" disabled style={{ opacity: 0.5 }}>
                      Edit
                    </button>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingBottom: 'var(--space-4)',
                    borderBottom: '1px solid var(--color-gray-200)'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-gray-800)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        Email Address
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-gray-600)'
                      }}>
                        {currentUser?.email}
                      </div>
                    </div>
                    <button className="btn btn-ghost" disabled style={{ opacity: 0.5 }}>
                      Change
                    </button>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingBottom: 'var(--space-4)',
                    borderBottom: '1px solid var(--color-gray-200)'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-gray-800)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        Sign-in Method
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-gray-600)'
                      }}>
                        {currentUser?.authProvider === 'google' ? 'Google Sign-In' : 'Email & Password'}
                      </div>
                    </div>
                    <button className="btn btn-ghost" disabled style={{ opacity: 0.5 }}>
                      Manage
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--space-8)' }}>
                <h3 style={{ 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-gray-800)',
                  marginBottom: 'var(--space-4)'
                }}>
                  Account Actions
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingBottom: 'var(--space-4)',
                    borderBottom: '1px solid var(--color-gray-200)'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-gray-800)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        Download Data
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-gray-500)'
                      }}>
                        Export your artwork and reflections
                      </div>
                    </div>
                    <button className="btn btn-ghost" disabled style={{ opacity: 0.5 }}>
                      Export
                    </button>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-gray-800)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        Delete Account
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-gray-500)'
                      }}>
                        Permanently delete your account and all data
                      </div>
                    </div>
                    <button 
                      className="btn" 
                      disabled 
                      style={{ 
                        opacity: 0.5,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--color-error)',
                        borderColor: 'rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'preferences' && (
            <div>
              <div className="card-header">
                <h2 className="card-title">Preferences</h2>
              </div>
              
              <div style={{ marginBottom: 'var(--space-8)' }}>
                <h3 style={{ 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-gray-800)',
                  marginBottom: 'var(--space-4)'
                }}>
                  Interface
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingBottom: 'var(--space-4)',
                    borderBottom: '1px solid var(--color-gray-200)'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-gray-800)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        Theme
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-gray-500)'
                      }}>
                        Choose your preferred color scheme
                      </div>
                    </div>
                    <select 
                      className="form-input" 
                      disabled 
                      style={{ 
                        width: '120px',
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      }}
                    >
                      <option>Light</option>
                      <option>Dark</option>
                      <option>Auto</option>
                    </select>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-gray-800)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        Language
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-gray-500)'
                      }}>
                        Select your preferred language
                      </div>
                    </div>
                    <select 
                      className="form-input" 
                      disabled 
                      style={{ 
                        width: '120px',
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      }}
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Note */}
          <div style={{
            padding: 'var(--space-5)',
            background: 'rgba(59, 130, 246, 0.05)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            marginTop: 'var(--space-8)'
          }}>
            <p style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-accent)',
              margin: 0,
              textAlign: 'center',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Settings functionality is currently in development. These options will be available in future updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;