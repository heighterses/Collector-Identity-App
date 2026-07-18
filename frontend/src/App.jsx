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
import TimelinePage from './pages/TimelinePage.jsx';
import ComparisonPage from './pages/ComparisonPage.jsx';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Single source of truth ──────────────────────────────────
  const [userArtworks, setUserArtworks] = useState([]);   // all artworks
  const [currentUser, setCurrentUser] = useState(null);

  // Navigation
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedArtworkId, setSelectedArtworkId] = useState(null); // for per-artwork pages
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

  // ── Event handlers ───────────────────────────────────────────
  const handleAuthSuccess = async () => {
    await checkAuthAndLoad();
  };

  const handleArtworkCreated = async () => {
    await checkAuthAndLoad();
    setCurrentPage('my-artwork');
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
    setCurrentPage('my-artwork');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    resetState();
    setCurrentPage('dashboard');
  };

  // Navigation accepts an optional artworkId for per-artwork pages
  const handleNavigation = (pageId, artworkId = null) => {
    setCurrentPage(pageId);
    if (artworkId) setSelectedArtworkId(artworkId);
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

      case 'timeline':
        return <TimelinePage />;

      case 'comparison':
        return <ComparisonPage />;

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
