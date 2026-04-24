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

  useEffect(() => {
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
          />
        );

      case 'reflection': {
        // Use selectedArtworkId if set, otherwise fall back to latest
        const artworkForReflection =
          userArtworks.find(a => a.id === selectedArtworkId) || latestArtwork;
        return <ReflectionPage artwork={artworkForReflection} />;
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
