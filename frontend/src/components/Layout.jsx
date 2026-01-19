import { useState } from 'react';
import { auth } from '../api.js';

const Layout = ({ children, currentUser, onLogout, currentPage, onNavigate, hasArtwork }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    auth.logout();
    onLogout();
  };

  // Dynamic navigation items based on user's artwork status
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    // Show "Add Artwork" only if user doesn't have artwork
    ...(!hasArtwork ? [{ id: 'add-artwork', label: 'Add Artwork', icon: '➕' }] : []),
    { id: 'my-artwork', label: 'My Artwork', icon: '🎨' },
    { id: 'reflections', label: 'Reflections', icon: '💭' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleNavClick = (itemId) => {
    if (onNavigate) {
      onNavigate(itemId);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Navigation Bar */}
      <header style={styles.topNav}>
        <div style={styles.topNavContent}>
          <h1 
            style={styles.appName}
            onClick={() => handleNavClick('dashboard')}
          >
            Collector Identity
          </h1>
          
          <div style={styles.profileSection}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={styles.profileButton}
            >
              <span style={styles.profileName}>{currentUser?.name || 'User'}</span>
              <span style={styles.profileIcon}>👤</span>
            </button>
            
            {profileMenuOpen && (
              <div style={styles.profileMenu}>
                <div style={styles.profileMenuHeader}>
                  <span style={styles.profileMenuName}>{currentUser?.name}</span>
                  <span style={styles.profileMenuEmail}>{currentUser?.email}</span>
                </div>
                <button onClick={handleLogout} style={styles.logoutButton}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={styles.mainContent}>
        {/* Left Sidebar */}
        <nav style={styles.sidebar}>
          <div style={styles.sidebarContent}>
            {navigationItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  ...styles.navItem,
                  ...(currentPage === item.id ? styles.navItemActive : {})
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span style={styles.navLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <main style={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#fafafa',
  },
  topNav: {
    background: 'white',
    borderBottom: '1px solid #e8e8e8',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  topNavContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  appName: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
    letterSpacing: '-0.02em',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
  profileSection: {
    position: 'relative',
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: 'none',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'all 0.2s ease',
  },
  profileName: {
    fontWeight: '500',
  },
  profileIcon: {
    fontSize: '16px',
  },
  profileMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    background: 'white',
    border: '1px solid #e8e8e8',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    minWidth: '200px',
    zIndex: 200,
  },
  profileMenuHeader: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
  },
  profileMenuName: {
    display: 'block',
    fontWeight: '600',
    color: '#1a1a1a',
    fontSize: '14px',
  },
  profileMenuEmail: {
    display: 'block',
    color: '#666',
    fontSize: '12px',
    marginTop: '4px',
  },
  logoutButton: {
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#dc2626',
    fontWeight: '500',
  },
  mainContent: {
    display: 'flex',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  sidebar: {
    width: '240px',
    background: 'white',
    borderRight: '1px solid #e8e8e8',
    minHeight: 'calc(100vh - 73px)',
  },
  sidebarContent: {
    padding: '24px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderRight: '3px solid transparent',
  },
  navItemActive: {
    background: '#f8f9fa',
    borderRightColor: '#1a1a1a',
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
    color: '#374151',
  },
  contentArea: {
    flex: 1,
    padding: '32px',
    background: '#fafafa',
  },
};

export default Layout;