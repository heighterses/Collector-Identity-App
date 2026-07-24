import { useState, useEffect } from 'react';
import { auth, artwork, reflection } from './api.js';

import LandingPage from './components/LandingPage.jsx';
import AddArtworkPage from './pages/AddArtworkPage.jsx';
import ReflectionPage from './pages/ReflectionPage.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyArtwork from './pages/MyArtwork.jsx';
import Reflections from './pages/Reflections.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Onboarding from './components/Onboarding.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import IdentityPage from './pages/IdentityPage.jsx';
import RoleSelectionPage from './pages/RoleSelectionPage.jsx';
import ChatPage from './pages/ChatPage.jsx';

// ── URL <-> page-id mapping ───────────────────────────────────────────────
// The app has no server-side routes — this just keeps the browser URL (and
// therefore a page refresh / direct link) in sync with which page is shown,
// using the History API directly rather than pulling in a router for a
// single centralized nav function.
const PAGE_PATHS = {
  dashboard:    '/dashboard',
  'add-artwork':'/add-artwork',
  'my-artwork': '/my-artwork',
  reflections:  '/reflections',
  reflection:   '/reflections',
  profile:      '/profile',
  settings:     '/settings',
  identity:     '/identity',
  chat:         '/chat',
};

const pathForPage = (pageId, artworkId) => {
  const base = PAGE_PATHS[pageId] || '/dashboard';
  return pageId === 'reflection' && artworkId ? `${base}/${artworkId}` : base;
};

const pageFromPath = (pathname) => {
  const [first, second] = pathname.split('/').filter(Boolean);
  const knownPages = new Set(Object.keys(PAGE_PATHS));
  if (!first || !knownPages.has(first)) return { page: 'dashboard', artworkId: null };
  const page = first === 'reflections' && second ? 'reflection' : first;
  return { page, artworkId: second || null };
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Single source of truth ──────────────────────────────────
  const [userArtworks, setUserArtworks] = useState([]);   // all artworks
  const [currentUser, setCurrentUser] = useState(null);

  // Navigation — initial page/artwork restored from the current URL so a
  // full page refresh (or a direct link) lands on the right page instead
  // of always falling back to the dashboard.
  const initialRoute = pageFromPath(window.location.pathname);
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [selectedArtworkId, setSelectedArtworkId] = useState(initialRoute.artworkId); // for per-artwork pages
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Derived helpers
  const latestArtwork = userArtworks[0] || null;
  const hasArtwork = userArtworks.length > 0;

  // ── Poll while any artwork is still processing ───────────
  useEffect(() => {
    const hasProcessing = userArtworks.some(a => a.status === 'processing');
    if (!hasProcessing || !isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const res = await artwork.getMine();
        const updated = res.artworks || [];
        setUserArtworks(updated);
        // Stop polling once all are done
        if (!updated.some(a => a.status === 'processing')) {
          clearInterval(interval);
        }
      } catch {
        // silent — keep polling
      }
    }, 4000); // every 4 seconds

    return () => clearInterval(interval);
  }, [userArtworks, isAuthenticated]);

  useEffect(() => {
    // Restore saved theme before anything renders
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-mode', saved === 'dark' ? 'dark' : 'light');

    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setShowResetPassword(true);
      setLoading(false);
      return;
    }
    checkAuthAndLoad();
  }, []);

  // Keep currentPage/selectedArtworkId in sync with browser back/forward.
  useEffect(() => {
    const onPopState = () => {
      const { page, artworkId } = pageFromPath(window.location.pathname);
      setCurrentPage(page);
      setSelectedArtworkId(artworkId);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // ── Load everything from the server ─────────────────────────
  const checkAuthAndLoad = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    if (!token) {
      resetState();
      setLoading(false);
      return;
    }

    try {
      const profileData = await auth.getProfile();
      setIsAuthenticated(true);
      setCurrentUser(profileData.user);

      try {
        const artworksResponse = await artwork.getMine();
        setUserArtworks(artworksResponse.artworks || []);
      } catch {
        setUserArtworks([]);
      }
    } catch {
      auth.logout();
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserArtworks([]);
  };

  // Single funnel for every page change: updates the state React renders
  // from AND pushes a matching URL, so the two can never drift apart.
  const navigateTo = (pageId, artworkId = null) => {
    setCurrentPage(pageId);
    if (artworkId) setSelectedArtworkId(artworkId);
    window.history.pushState({}, '', pathForPage(pageId, artworkId));
  };

  // ── Event handlers ───────────────────────────────────────────
  const handleAuthSuccess = async () => {
    await checkAuthAndLoad();
  };

  const handleArtworkCreated = async () => {
    await checkAuthAndLoad();
    navigateTo('my-artwork');
  };

  // Used when artwork is added from inside chat: refetches the artwork list
  // without checkAuthAndLoad's global loading flag, which would otherwise
  // flash a full-page spinner over the chat and lose the user's place.
  const handleArtworkAddedInPlace = async () => {
    try {
      const res = await artwork.getMine();
      setUserArtworks(res.artworks || []);
    } catch {
      // silent — the existing processing-poll effect will retry
    }
  };

  const handleArtworkDeleted = async () => {
    await checkAuthAndLoad();
    navigateTo('my-artwork');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    resetState();
    navigateTo('dashboard');
  };

  // Navigation accepts an optional artworkId for per-artwork pages
  const handleNavigation = (pageId, artworkId = null) => {
    navigateTo(pageId, artworkId);
  };

  // ── Page rendering ───────────────────────────────────────────
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            currentUser={currentUser}
            artworks={userArtworks}
            onNavigate={handleNavigation}
          />
        );

      case 'add-artwork':
        return (
          <AddArtworkPage
            onArtworkCreated={handleArtworkCreated}
            currentUser={currentUser}
            onNavigate={handleNavigation}
          />
        );

      case 'my-artwork':
        return (
          <MyArtwork
            artworks={userArtworks}
            onNavigate={handleNavigation}
            onArtworkDeleted={handleArtworkDeleted}
          />
        );

      case 'reflections':
        return (
          <Reflections
            onNavigate={handleNavigation}
            currentUser={currentUser}
            artworks={userArtworks}
            initialArtworkId={selectedArtworkId}
          />
        );

      case 'reflection': {
        // Redirect: treat the standalone reflection route as an alias for
        // the main Reflections page with the artwork pre-selected.
        // selectedArtworkId is already set by handleNavigation before this renders.
        return (
          <Reflections
            onNavigate={handleNavigation}
            currentUser={currentUser}
            artworks={userArtworks}
            initialArtworkId={selectedArtworkId}
          />
        );
      }

      case 'profile':
        return <Profile currentUser={currentUser} onUserUpdate={setCurrentUser} />;

      case 'settings':
        return <Settings currentUser={currentUser} />;

      case 'identity': {
        // Use selectedArtworkId if set, otherwise latest
        const artworkForIdentity =
          userArtworks.find(a => a.id === selectedArtworkId) || latestArtwork;
        return <IdentityPage artworkId={artworkForIdentity?.id} />;
      }

      case 'chat':
        return (
          <ChatPage
            artworks={userArtworks}
            onArtworkCreated={handleArtworkAddedInPlace}
            onNavigate={handleNavigation}
          />
        );

      default:
        return (
          <Dashboard
            currentUser={currentUser}
            artworks={userArtworks}
            onNavigate={handleNavigation}
          />
        );
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--paper)',
      }}>
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  if (showResetPassword) return <ResetPasswordPage />;

  if (!isAuthenticated) {
    return <LandingPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Role selection gate - must complete before accessing app
  if (!currentUser?.user_role) {
    return (
      <RoleSelectionPage
        onRoleSelected={(role) => {
          setCurrentUser(prev => ({ ...prev, user_role: role }));
        }}
      />
    );
  }

  return (
    <div className="App">
      <Layout
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
        userArtwork={latestArtwork}
      >
        {renderPageContent()}
      </Layout>
      <Onboarding currentUser={currentUser} />
    </div>
  );
};

export default App;
