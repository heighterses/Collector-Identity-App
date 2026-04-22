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

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasArtwork, setHasArtwork] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userArtwork, setUserArtwork] = useState(null); // latest
  const [userArtworks, setUserArtworks] = useState([]); // ALL artworks

  const [userReflection, setUserReflection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');

    if (resetToken) {
      setShowResetPassword(true);
      setLoading(false);
      return;
    }

    checkAuthAndArtworkStatus();
  }, []);

  const checkAuthAndArtworkStatus = async () => {
    setLoading(true);

    const token = localStorage.getItem("authToken");

    if (!token) {
      setIsAuthenticated(false);
      setHasArtwork(false);
      setUserArtwork(null);
      setUserArtworks([]);
      setUserReflection(null);
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      const profileData = await auth.getProfile();

      setIsAuthenticated(true);
      setCurrentUser(profileData.user);

      let artworksResponse;

      try {
        artworksResponse = await artwork.getMine();
      } catch (err) {
        console.warn("No artworks yet");

        setHasArtwork(false);
        setUserArtwork(null);
        setUserArtworks([]);
        setUserReflection(null);
        setCurrentPage('dashboard');

        setLoading(false);
        return;
      }

      const artworks = artworksResponse.artworks || [];

      setUserArtworks(artworks);

      if (artworks.length > 0) {
        const latest = artworks[0];

        setUserArtwork(latest);
        setHasArtwork(true);

        try {
          const reflectionResponse = await reflection.getByArtworkId(latest.id);
          setUserReflection(reflectionResponse?.reflection || null);
        } catch {
          setUserReflection(null);
        }

      } else {
        setHasArtwork(false);
        setUserArtwork(null);
        setUserReflection(null);
      }

    } catch (error) {
      auth.logout();

      setIsAuthenticated(false);
      setHasArtwork(false);
      setUserArtwork(null);
      setUserArtworks([]);
      setUserReflection(null);
      setCurrentUser(null);

    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    await checkAuthAndArtworkStatus();
  };

  const handleArtworkCreated = async () => {
    await checkAuthAndArtworkStatus(); // refresh everything
    setCurrentPage('my-artwork');
  };

  const handleArtworkDeleted = async () => {
    await checkAuthAndArtworkStatus();
  };

  const handleNavigation = (pageId) => {
    setCurrentPage(pageId);
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} onNavigate={handleNavigation} />;

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
        return <Reflections onNavigate={handleNavigation} currentUser={currentUser} />;

      case 'reflection':
        return <ReflectionPage artwork={userArtwork} />;

      case 'profile':
        return <Profile currentUser={currentUser} onUserUpdate={setCurrentUser} />;

      case 'settings':
        return <Settings currentUser={currentUser} />;

      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (showResetPassword) {
    return <ResetPasswordPage />;
  }

  if (!isAuthenticated) {
    return <LandingPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="App">
      <Layout
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigation}
      >
        {renderPageContent()}
      </Layout>

      <Onboarding currentUser={currentUser} />
    </div>
  );
};

export default App;