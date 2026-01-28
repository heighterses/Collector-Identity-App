import { useState, useEffect } from 'react';

const Settings = ({ currentUser }) => {
  const [activeSection, setActiveSection] = useState('account');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Load theme from localStorage on component mount
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

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

  const settingSections = [
    { id: 'account', label: 'Account & Security', icon: 'Security' },
    { id: 'privacy', label: 'Privacy', icon: 'Shield' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell' },
    { id: 'preferences', label: 'Preferences', icon: 'Settings' },
  ];

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
              style={styles.navButton}
            >
              <span style={styles.navLabel}>{section.label}</span>
            </button>
          ))}
        </nav>

        {/* Settings Content */}
        <div className="card">
          <div className="card-content">
            {activeSection === 'account' && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Account & Security</h2>
                
                <div style={styles.settingGroup}>
                  <h3 style={styles.groupTitle}>Personal Information</h3>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Full Name</span>
                      <span style={styles.settingValue}>{currentUser?.name}</span>
                    </div>
                    <button className="btn btn-secondary" disabled>
                      Edit
                    </button>
                  </div>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Email Address</span>
                      <span style={styles.settingValue}>{currentUser?.email}</span>
                    </div>
                    <button className="btn btn-secondary" disabled>
                      Change
                    </button>
                  </div>
                </div>

                <div style={styles.settingGroup}>
                  <h3 style={styles.groupTitle}>Authentication</h3>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Sign-in Method</span>
                      <span style={styles.settingValue}>
                        {currentUser?.authProvider === 'google' ? 'Google Sign-In' : 'Email & Password'}
                      </span>
                    </div>
                    <button className="btn btn-secondary" disabled>
                      Manage
                    </button>
                  </div>
                  {currentUser?.authProvider === 'email' && (
                    <div style={styles.settingItem}>
                      <div style={styles.settingInfo}>
                        <span style={styles.settingLabel}>Password</span>
                        <span style={styles.settingValue}>••••••••</span>
                      </div>
                      <button className="btn btn-secondary" disabled>
                        Change
                      </button>
                    </div>
                  )}
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Connected Accounts</span>
                      <span style={styles.settingValue}>
                        {currentUser?.authProvider === 'google' ? 'Google' : 'Email'}
                      </span>
                    </div>
                    <button className="btn btn-secondary" disabled>
                      Manage
                    </button>
                  </div>
                </div>

                <div style={styles.settingGroup}>
                  <h3 style={styles.groupTitle}>Active Sessions</h3>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>This device</span>
                      <span style={styles.settingDescription}>
                        Current session • Last active now
                      </span>
                    </div>
                    <span style={styles.currentDevice}>Current</span>
                  </div>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Sign out from all devices</span>
                      <span style={styles.settingDescription}>
                        End all active sessions except this one
                      </span>
                    </div>
                    <button className="btn btn-secondary" disabled>
                      Sign Out All
                    </button>
                  </div>
                </div>

                <div style={styles.settingGroup}>
                  <h3 style={styles.groupTitle}>Account Actions</h3>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Download Data</span>
                      <span style={styles.settingDescription}>
                        Export your artwork and reflections
                      </span>
                    </div>
                    <button className="btn btn-secondary" disabled>
                      Export
                    </button>
                  </div>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Delete Account</span>
                      <span style={styles.settingDescription}>
                        Permanently delete your account and all data
                      </span>
                    </div>
                    <button style={styles.dangerButton} disabled>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Privacy</h2>
                
                <div style={styles.settingGroup}>
                  <h3 style={styles.groupTitle}>Profile Visibility</h3>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Profile visibility</span>
                      <span style={styles.settingDescription}>
                        Control who can see your profile (future feature)
                      </span>
                    </div>
                    <select style={styles.settingSelect} disabled>
                      <option>Private</option>
                      <option>Public</option>
                    </select>
                  </div>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Artwork visibility</span>
                      <span style={styles.settingDescription}>
                        Choose who can view your artwork
                      </span>
                    </div>
                    <select style={styles.settingSelect} disabled>
                      <option>Only me</option>
                      <option>Public</option>
                    </select>
                  </div>
                </div>

                <div style={styles.settingGroup}>
                  <h3 style={styles.groupTitle}>Data Usage</h3>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>How we use your data</span>
                      <span style={styles.settingDescription}>
                        Your artwork and reflections are used only to generate personalized insights. We never share your creative work with third parties or use it for training AI models.
                      </span>
                    </div>
                  </div>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Analytics</span>
                      <span style={styles.settingDescription}>
                        Help improve the app by sharing usage data
                      </span>
                    </div>
                    <label style={styles.toggle}>
                      <input type="checkbox" defaultChecked disabled />
                      <span style={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Notifications</h2>
                
                <div style={styles.settingGroup}>
                  <h3 style={styles.groupTitle}>Email Notifications</h3>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Email notifications for reflections</span>
                      <span style={styles.settingDescription}>
                        Get notified when new reflections are generated
                      </span>
                    </div>
                    <label style={styles.toggle}>
                      <input type="checkbox" defaultChecked disabled />
                      <span style={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Email notifications for account activity</span>
                      <span style={styles.settingDescription}>
                        Security alerts and account changes
                      </span>
                    </div>
                    <label style={styles.toggle}>
                      <input type="checkbox" defaultChecked disabled />
                      <span style={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Marketing emails</span>
                      <span style={styles.settingDescription}>
                        Product updates and feature announcements
                      </span>
                    </div>
                    <label style={styles.toggle}>
                      <input type="checkbox" disabled />
                      <span style={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Preferences</h2>
                
                <div style={styles.settingGroup}>
                  <h3 style={styles.groupTitle}>Interface</h3>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Language</span>
                      <span style={styles.settingDescription}>
                        Choose your preferred language
                      </span>
                    </div>
                    <select style={styles.settingSelect} disabled>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Timezone</span>
                      <span style={styles.settingDescription}>
                        Used for timestamps and scheduling
                      </span>
                    </div>
                    <select style={styles.settingSelect} disabled>
                      <option>Auto-detect</option>
                      <option>Pacific Time (PT)</option>
                      <option>Eastern Time (ET)</option>
                      <option>Central Time (CT)</option>
                      <option>Mountain Time (MT)</option>
                    </select>
                  </div>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Theme</span>
                      <span style={styles.settingDescription}>
                        Choose your preferred color scheme
                      </span>
                    </div>
                    <select 
                      style={styles.settingSelect} 
                      value={theme}
                      onChange={handleThemeChange}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                <div style={styles.settingGroup}>
                  <h3 style={styles.groupTitle}>Dashboard</h3>
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Default dashboard landing</span>
                      <span style={styles.settingDescription}>
                        Choose what you see first when you sign in
                      </span>
                    </div>
                    <select style={styles.settingSelect} disabled>
                      <option>Dashboard overview</option>
                      <option>My artwork</option>
                      <option>Recent reflections</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Note */}
            <div style={styles.settingsNote}>
              <p style={styles.noteText}>
                Settings functionality is currently in development. These options will be available in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  settingsLayout: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gap: 'var(--space-8)',
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
  },
  navLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
  },
  section: {
    marginBottom: 'var(--space-8)',
  },
  sectionTitle: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-900)',
    marginBottom: 'var(--space-6)',
  },
  settingGroup: {
    marginBottom: 'var(--space-8)',
    paddingBottom: 'var(--space-6)',
    borderBottom: '1px solid var(--color-gray-200)',
  },
  groupTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-900)',
    marginBottom: 'var(--space-4)',
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-4) 0',
    borderBottom: '1px solid var(--color-gray-100)',
  },
  settingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    flex: 1,
  },
  settingLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-900)',
  },
  settingValue: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-600)',
  },
  settingDescription: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-gray-500)',
    lineHeight: 'var(--line-height-normal)',
  },
  dangerButton: {
    padding: 'var(--space-2) var(--space-4)',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid rgba(220, 38, 38, 0.2)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-error)',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  settingSelect: {
    padding: 'var(--space-2) var(--space-3)',
    border: '1px solid var(--color-gray-300)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-600)',
    background: 'var(--color-white)',
    cursor: 'pointer',
  },
  toggle: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
  },
  toggleSlider: {
    position: 'absolute',
    cursor: 'not-allowed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--color-gray-300)',
    transition: 'var(--transition-normal)',
    borderRadius: '24px',
    opacity: 0.6,
  },
  currentDevice: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-gray-500)',
    padding: 'var(--space-1) var(--space-2)',
    background: 'var(--color-gray-100)',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 'var(--font-weight-medium)',
  },
  settingsNote: {
    padding: 'var(--space-5)',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    marginTop: 'var(--space-8)',
  },
  noteText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-accent)',
    margin: 0,
    textAlign: 'center',
    fontWeight: 'var(--font-weight-medium)',
  },
};

export default Settings;