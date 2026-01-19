import { useState } from 'react';

const Settings = ({ currentUser }) => {
  const [activeSection, setActiveSection] = useState('account');

  const settingSections = [
    { id: 'account', label: 'Account & Security', icon: '🔐' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>Manage your account and preferences</p>
      </div>

      <div style={styles.settingsLayout}>
        {/* Settings Navigation */}
        <nav style={styles.settingsNav}>
          {settingSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                ...styles.navButton,
                ...(activeSection === section.id ? styles.navButtonActive : {})
              }}
            >
              <span style={styles.navIcon}>{section.icon}</span>
              <span style={styles.navLabel}>{section.label}</span>
            </button>
          ))}
        </nav>

        {/* Settings Content */}
        <div style={styles.settingsContent}>
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
                  <button style={styles.settingButton} disabled>
                    Edit
                  </button>
                </div>
                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <span style={styles.settingLabel}>Email Address</span>
                    <span style={styles.settingValue}>{currentUser?.email}</span>
                  </div>
                  <button style={styles.settingButton} disabled>
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
                  <button style={styles.settingButton} disabled>
                    Manage
                  </button>
                </div>
                {currentUser?.authProvider === 'email' && (
                  <div style={styles.settingItem}>
                    <div style={styles.settingInfo}>
                      <span style={styles.settingLabel}>Password</span>
                      <span style={styles.settingValue}>••••••••</span>
                    </div>
                    <button style={styles.settingButton} disabled>
                      Change
                    </button>
                  </div>
                )}
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
                  <button style={styles.settingButton} disabled>
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
                <h3 style={styles.groupTitle}>Data Collection</h3>
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
                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <span style={styles.settingLabel}>Crash Reports</span>
                    <span style={styles.settingDescription}>
                      Automatically send crash reports to help fix issues
                    </span>
                  </div>
                  <label style={styles.toggle}>
                    <input type="checkbox" defaultChecked disabled />
                    <span style={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <div style={styles.settingGroup}>
                <h3 style={styles.groupTitle}>Content Visibility</h3>
                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <span style={styles.settingLabel}>Public Profile</span>
                    <span style={styles.settingDescription}>
                      Make your creative identity visible to others
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

          {activeSection === 'notifications' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Notifications</h2>
              
              <div style={styles.settingGroup}>
                <h3 style={styles.groupTitle}>Email Notifications</h3>
                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <span style={styles.settingLabel}>Reflection Updates</span>
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
                    <span style={styles.settingLabel}>Product Updates</span>
                    <span style={styles.settingDescription}>
                      Stay informed about new features and improvements
                    </span>
                  </div>
                  <label style={styles.toggle}>
                    <input type="checkbox" defaultChecked disabled />
                    <span style={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <div style={styles.settingGroup}>
                <h3 style={styles.groupTitle}>Push Notifications</h3>
                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <span style={styles.settingLabel}>Browser Notifications</span>
                    <span style={styles.settingDescription}>
                      Receive notifications in your browser
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
                    <span style={styles.settingLabel}>Theme</span>
                    <span style={styles.settingDescription}>
                      Choose your preferred color scheme
                    </span>
                  </div>
                  <select style={styles.settingSelect} disabled>
                    <option>Light</option>
                    <option>Dark</option>
                    <option>Auto</option>
                  </select>
                </div>
                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <span style={styles.settingLabel}>Language</span>
                    <span style={styles.settingDescription}>
                      Select your preferred language
                    </span>
                  </div>
                  <select style={styles.settingSelect} disabled>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
              </div>

              <div style={styles.settingGroup}>
                <h3 style={styles.groupTitle}>Creative Process</h3>
                <div style={styles.settingItem}>
                  <div style={styles.settingInfo}>
                    <span style={styles.settingLabel}>Auto-generate Reflections</span>
                    <span style={styles.settingDescription}>
                      Automatically create reflections when artwork is uploaded
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

          {/* Settings Note */}
          <div style={styles.settingsNote}>
            <p style={styles.noteText}>
              Settings functionality is currently in development. These options will be available in future updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  settingsLayout: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gap: '32px',
  },
  settingsNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    color: '#666',
  },
  navButtonActive: {
    background: '#f8f9fa',
    color: '#1a1a1a',
  },
  navIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
  },
  navLabel: {
    fontSize: '14px',
    fontWeight: '500',
  },
  settingsContent: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f0f0f0',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 24px 0',
  },
  settingGroup: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #f0f0f0',
  },
  groupTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 16px 0',
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid #f8f9fa',
  },
  settingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  settingLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a1a1a',
  },
  settingValue: {
    fontSize: '14px',
    color: '#666',
  },
  settingDescription: {
    fontSize: '12px',
    color: '#999',
    lineHeight: '1.4',
  },
  settingButton: {
    padding: '8px 16px',
    background: '#f8f9fa',
    border: '1px solid #e8e8e8',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  dangerButton: {
    padding: '8px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#dc2626',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  settingSelect: {
    padding: '8px 12px',
    border: '1px solid #e8e8e8',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#666',
    background: '#f8f9fa',
    cursor: 'not-allowed',
    opacity: 0.6,
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
    backgroundColor: '#ccc',
    transition: '0.4s',
    borderRadius: '24px',
    opacity: 0.6,
  },
  settingsNote: {
    padding: '20px',
    background: '#f0f9ff',
    borderRadius: '12px',
    border: '1px solid #bae6fd',
    marginTop: '32px',
  },
  noteText: {
    fontSize: '14px',
    color: '#0369a1',
    margin: 0,
    textAlign: 'center',
    fontWeight: '500',
  },
};

export default Settings;