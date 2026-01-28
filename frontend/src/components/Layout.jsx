import { useState } from 'react';

const Layout = ({ children, currentUser, onLogout, currentPage, onNavigate, hasArtwork }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
  };

  // SVG Icons - Heroicons style, minimal and consistent
  const icons = {
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    addArtwork: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
        <line x1="12" y1="7" x2="12" y2="17"/>
        <line x1="7" y1="12" x2="17" y2="12"/>
      </svg>
    ),
    myArtwork: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2" width="12" height="16" rx="2"/>
        <rect x="4" y="4" width="12" height="16" rx="2"/>
        <rect x="2" y="6" width="12" height="16" rx="2"/>
      </svg>
    ),
    reflections: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    profile: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    settings: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )
  };

  // Navigation items with semantic SVG icons
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    ...(!hasArtwork ? [{ id: 'add-artwork', label: 'Add Artwork', icon: icons.addArtwork }] : []),
    { id: 'my-artwork', label: 'My Artwork', icon: icons.myArtwork },
    { id: 'reflections', label: 'Reflections', icon: icons.reflections },
    { id: 'profile', label: 'Profile', icon: icons.profile },
    { id: 'settings', label: 'Settings', icon: icons.settings },
  ];

  const handleNavClick = (itemId) => {
    if (onNavigate) {
      onNavigate(itemId);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="app-layout">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="header-content">
          {/* Left: Logo + Brand */}
          <div className="header-left">
            <h1 
              className="app-title"
              onClick={() => handleNavClick('dashboard')}
            >
              Collector Identity
            </h1>
          </div>

          {/* Center: Main Navigation */}
          <nav className="main-navigation">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item ${currentPage === item.id ? 'nav-item--active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
          
          {/* Right: Profile Section */}
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
              <span className="profile-chevron">▾</span>
            </button>
            
            {profileMenuOpen && (
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <span className="profile-menu-name">{currentUser?.name}</span>
                  <span className="profile-menu-email">{currentUser?.email}</span>
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
                    onClick={handleLogout} 
                    className="profile-menu-action profile-menu-action--logout"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;