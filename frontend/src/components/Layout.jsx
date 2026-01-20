import { useState } from 'react';
import { auth } from '../api.js';

const Layout = ({ children, currentUser, onLogout, currentPage, onNavigate, hasArtwork }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    auth.logout();
    onLogout();
  };

  // Navigation items with simple, monochrome icons
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
    ...(!hasArtwork ? [{ id: 'add-artwork', label: 'Add Artwork', icon: '⊕' }] : []),
    { id: 'my-artwork', label: 'My Artwork', icon: '◈' },
    { id: 'reflections', label: 'Reflections', icon: '◐' },
    { id: 'profile', label: 'Profile', icon: '◯' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ];

  const handleNavClick = (itemId) => {
    if (onNavigate) {
      onNavigate(itemId);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div style={styles.container}>
      {/* Top Navigation Bar */}
      <header style={styles.topNav}>
        <div style={styles.topNavContent}>
          <div style={styles.leftSection}>
            <button
              onClick={toggleSidebar}
              style={styles.sidebarToggle}
              aria-label="Toggle sidebar"
            >
              <span style={styles.hamburger}>☰</span>
            </button>
            <h1 
              style={styles.appName}
              onClick={() => handleNavClick('dashboard')}
            >
              Collector Identity
            </h1>
          </div>
          
          <div style={styles.profileSection}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={styles.profileButton}
            >
              <span style={styles.profileName}>{currentUser?.name || 'User'}</span>
              <span style={styles.profileIcon}>◯</span>
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
        {/* Collapsible Sidebar */}
        <nav 
          style={{
            ...styles.sidebar,
            ...(sidebarCollapsed ? styles.sidebarCollapsed : {})
          }}
        >
          <div style={styles.sidebarContent}>
            {navigationItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  ...styles.navItem,
                  ...(currentPage === item.id ? styles.navItemActive : {}),
                  ...(sidebarCollapsed ? styles.navItemCollapsed : {})
                }}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <span style={styles.navLabel}>{item.label}</span>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <main 
          style={{
            ...styles.contentArea,
            ...(sidebarCollapsed ? styles.contentAreaExpanded : {})
          }}
        >
          <div style={styles.contentWrapper}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#fafafa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  topNav: {
    background: 'white',
    borderBottom: '1px solid #e1e1e1',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  topNavContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    maxWidth: '100%',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  sidebarToggle: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
    color: '#666',
  },
  hamburger: {
    fontSize: '18px',
    display: 'block',
  },
  appName: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    cursor: 'pointer',
    color: '#1a1a1a',
    transition: 'color 0.2s ease',
  },
  profileSection: {
    position: 'relative',
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'none',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    transition: 'all 0.2s ease',
  },
  profileName: {
    fontWeight: '500',
    color: '#1a1a1a',
  },
  profileIcon: {
    fontSize: '16px',
    color: '#666',
  },
  profileMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    background: 'white',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    minWidth: '200px',
    zIndex: 200,
    overflow: 'hidden',
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
    marginBottom: '4px',
  },
  profileMenuEmail: {
    display: 'block',
    color: '#666',
    fontSize: '12px',
  },
  logoutButton: {
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    transition: 'background-color 0.2s ease',
  },
  mainContent: {
    display: 'flex',
    minHeight: 'calc(100vh - 65px)',
  },
  sidebar: {
    width: '240px',
    background: 'white',
    borderRight: '1px solid #e1e1e1',
    transition: 'width 0.3s ease',
    flexShrink: 0,
    overflow: 'hidden',
  },
  sidebarCollapsed: {
    width: '60px',
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
    color: '#666',
    fontSize: '14px',
    fontWeight: '500',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    padding: '12px 18px',
  },
  navItemActive: {
    background: '#f8f9fa',
    color: '#1a1a1a',
    borderRight: '3px solid #1a1a1a',
  },
  navIcon: {
    fontSize: '16px',
    width: '16px',
    textAlign: 'center',
    color: 'inherit',
  },
  navLabel: {
    whiteSpace: 'nowrap',
  },
  contentArea: {
    flex: 1,
    transition: 'margin-left 0.3s ease',
    background: '#fafafa',
  },
  contentAreaExpanded: {
    // Content expands when sidebar is collapsed
  },
  contentWrapper: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
};

// Add hover effects via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  /* Subtle hover effects */
  .layout-sidebar-toggle:hover {
    background-color: #f5f5f5 !important;
  }
  
  .layout-profile-button:hover {
    background-color: #f8f9fa !important;
    border-color: #d0d7de !important;
  }
  
  .layout-nav-item:hover {
    background-color: #f8f9fa !important;
    color: #1a1a1a !important;
  }
  
  .layout-logout-button:hover {
    background-color: #f8f9fa !important;
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .layout-sidebar {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      height: 70px !important;
      z-index: 1000 !important;
      border-right: none !important;
      border-top: 1px solid #e1e1e1 !important;
      background: white !important;
    }
    
    .layout-sidebar-content {
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      padding: 8px 16px !important;
      height: 100% !important;
    }
    
    .layout-nav-item {
      flex-direction: column !important;
      gap: 4px !important;
      padding: 8px 12px !important;
      min-width: 50px !important;
      text-align: center !important;
      border-right: none !important;
    }
    
    .layout-nav-label {
      font-size: 11px !important;
    }
    
    .layout-nav-icon {
      font-size: 18px !important;
    }
    
    .layout-content-wrapper {
      padding: 16px 16px 90px 16px !important;
    }
    
    .layout-sidebar-toggle {
      display: none !important;
    }
  }
  
  /* Tablet responsive */
  @media (min-width: 769px) and (max-width: 1024px) {
    .layout-content-wrapper {
      padding: 24px !important;
    }
  }
`;

// Apply classes for hover effects
if (!document.head.querySelector('#layout-styles')) {
  styleSheet.id = 'layout-styles';
  document.head.appendChild(styleSheet);
}

export default Layout;