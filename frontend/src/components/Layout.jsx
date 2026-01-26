import { useState, useEffect } from 'react';
import '../styles.css';

const Layout = ({ children, currentUser, onLogout, currentPage, onNavigate, hasArtwork }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest('.profile-section')) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  // Navigation items with clean icons
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    ...(!hasArtwork ? [{ id: 'add-artwork', label: 'Add Artwork', icon: 'plus' }] : []),
    { id: 'my-artwork', label: 'My Artwork', icon: 'image' },
    { id: 'reflections', label: 'Reflections', icon: 'message-circle' },
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const handleNavClick = (itemId) => {
    if (onNavigate) {
      onNavigate(itemId);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <button
            onClick={toggleSidebar}
            className="sidebar-toggle"
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 
            className="app-title"
            onClick={() => handleNavClick('dashboard')}
          >
            Collector Identity
          </h1>
        </div>
        
        <div className="profile-section">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="profile-button"
            aria-expanded={profileMenuOpen}
          >
            <div className="profile-avatar">
              {getInitials(currentUser?.name)}
            </div>
            <span className="profile-name">{currentUser?.name || 'User'}</span>
            <svg className="profile-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>
          
          {profileMenuOpen && (
            <div className="profile-menu">
              <div className="profile-menu-header">
                <span className="profile-menu-name">{currentUser?.name || 'User'}</span>
                <span className="profile-menu-email">{currentUser?.email || 'user@example.com'}</span>
              </div>
              <div className="profile-menu-actions">
                <button 
                  onClick={() => {
                    handleNavClick('profile');
                    setProfileMenuOpen(false);
                  }}
                  className="profile-menu-action"
                >
                  Profile
                </button>
                <button 
                  onClick={() => {
                    handleNavClick('settings');
                    setProfileMenuOpen(false);
                  }}
                  className="profile-menu-action"
                >
                  Settings
                </button>
                <button 
                  onClick={() => {
                    onLogout();
                    setProfileMenuOpen(false);
                  }}
                  className="profile-menu-action profile-menu-action--logout"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="app-main">
        {/* Sidebar */}
        <nav className={`app-sidebar ${sidebarCollapsed ? 'app-sidebar--collapsed' : ''}`}>
          <div className="sidebar-content">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item ${currentPage === item.id ? 'nav-item--active' : ''}`}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="nav-icon">
                  {item.icon === 'home' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9,22 9,12 15,12 15,22"></polyline>
                    </svg>
                  )}
                  {item.icon === 'plus' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                  )}
                  {item.icon === 'image' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21,15 16,10 5,21"></polyline>
                    </svg>
                  )}
                  {item.icon === 'message-circle' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                    </svg>
                  )}
                  {item.icon === 'user' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  )}
                  {item.icon === 'settings' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17-4a4 4 0 0 1-8 0 4 4 0 0 1 8 0zM7 17a4 4 0 0 1-8 0 4 4 0 0 1 8 0z"></path>
                    </svg>
                  )}
                </span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="app-content">
          <div className="content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;