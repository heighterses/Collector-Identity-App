import { useState, useEffect, useRef } from 'react';

const PAGE_META = {
  dashboard:    ['Overview', 'Your Identity'],
  'add-artwork':['Collection', 'Add Artwork'],
  'my-artwork': ['Collection', 'My Artwork'],
  reflections:  ['Interpretation', 'Reflections'],
  reflection:   ['Interpretation', 'Reflections'],
  identity:     ['Analysis', 'Identity Analysis'],
  chat:         ['Interpretation', 'Chat'],
  profile:      ['Account', 'Profile'],
  settings:     ['Account', 'Settings'],
};

const Layout = ({ children, currentUser, onLogout, currentPage, onNavigate, userArtwork }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'light');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close the mobile drawer whenever the page changes
  useEffect(() => { setDrawerOpen(false); }, [currentPage]);

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-mode', next);
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
  };

  const handleAvatarClick = () => setDropdownOpen(!dropdownOpen);

  const handleDropdownItemClick = (action) => {
    setDropdownOpen(false);
    if (action === 'logout') onLogout();
    else onNavigate(action);
  };

  const getUserInitial = () => (currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U');

  const icons = {
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    addArtwork: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/>
      </svg>
    ),
    myArtwork: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2" width="12" height="16" rx="2"/><rect x="4" y="4" width="12" height="16" rx="2"/><rect x="2" y="6" width="12" height="16" rx="2"/>
      </svg>
    ),
    reflections: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    profile: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    settings: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    identity: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    chat: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'add-artwork', label: 'Add Artwork', icon: icons.addArtwork },
    { id: 'my-artwork', label: 'My Artwork', icon: icons.myArtwork },
    { id: 'reflections', label: 'Reflections', icon: icons.reflections },
    ...(userArtwork ? [{ id: 'identity', label: 'Identity', icon: icons.identity }] : []),
    { id: 'chat', label: 'Chat', icon: icons.chat },
    { id: 'profile', label: 'Profile', icon: icons.profile },
    { id: 'settings', label: 'Settings', icon: icons.settings },
  ];

  const handleNavClick = (itemId) => {
    if (onNavigate) onNavigate(itemId);
  };

  const [crumb, title] = PAGE_META[currentPage] || ['Overview', 'Your Identity'];

  const renderNav = () => (
    <nav className="side-nav">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNavClick(item.id)}
          className={`side-nav-item ${currentPage === item.id ? 'side-nav-item--active' : ''}`}
          data-nav={item.id}
          title={collapsed ? item.label : undefined}
        >
          <span className="side-nav-dot" />
          <span className="side-nav-icon">{item.icon}</span>
          <span className="side-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className={`app-layout app-layout--sidebar ${collapsed ? 'app-layout--collapsed' : ''}`}>
      {drawerOpen && <div className="side-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}

      <aside className={`app-sidebar ${drawerOpen ? 'app-sidebar--open' : ''}`}>
        <div className="side-brand">
          <div className="side-brand-name">Collector</div>
          <div className="side-brand-sub">Identity</div>
          <button className="side-collapse-btn" onClick={toggleCollapsed} aria-label="Collapse sidebar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={collapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
            </svg>
          </button>
        </div>

        {renderNav()}

        <div className="side-user-wrapper" ref={wrapperRef}>
          <button className="side-user-card" onClick={handleAvatarClick}>
            <div className="side-user-avatar">
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt="Avatar"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                  }}
                />
              ) : null}
              <span className="side-user-avatar-initial" style={{ display: currentUser?.avatar_url ? 'none' : 'flex' }}>
                {getUserInitial()}
              </span>
            </div>
            <div className="side-user-info">
              <div className="side-user-name">{currentUser?.name || 'User'}</div>
              <div className="side-user-role">{currentUser?.user_role || 'Collector'}</div>
            </div>
          </button>

          {dropdownOpen && (
            <div className="side-user-dropdown">
              <button onClick={() => handleDropdownItemClick('profile')}>Profile</button>
              <button onClick={() => handleDropdownItemClick('settings')}>Settings</button>
              <button onClick={() => handleDropdownItemClick('logout')}>Logout</button>
            </div>
          )}
        </div>
      </aside>

      <div className="app-main-col">
        <header className="app-topbar">
          <button className="side-drawer-toggle" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="app-topbar-heading">
            <div className="app-topbar-crumb">{crumb}</div>
            <h1 className="app-topbar-title">{title}</h1>
          </div>
          <div className="app-topbar-actions">
            <button className="mode-pill-toggle" onClick={toggleMode} aria-label="Toggle color mode">
              <span className="mode-pill-swatch" data-mode-preview={mode} />
              <span>{mode === 'light' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

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
