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
  const [userArtwork, setUserArtwork] = useState(null);
  const [userReflection, setUserReflection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    // Check for reset password token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (resetToken) {
      setShowResetPassword(true);
      return;
    }
    
    checkAuthAndArtworkStatus();
  }, []);

  const checkAuthAndArtworkStatus = async () => {
    setLoading(true);
    console.log('Checking auth status...');

    // Check if user is authenticated by verifying token with backend
    if (!auth.isAuthenticated()) {
      console.log('No token found, showing login');
      // CLEAN STATE RESET on no auth
      setIsAuthenticated(false);
      setHasArtwork(false);
      setUserArtwork(null);
      setUserReflection(null);
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    console.log('Token found, verifying with backend...');
    // Verify token is valid by making a test API call
    try {
      const profileData = await auth.getProfile();
      console.log('Token valid, user authenticated:', profileData);
      setIsAuthenticated(true);
      setCurrentUser(profileData.user);

      // Try to get user's artwork
      try {
        const artworkResponse = await artwork.getMine();
        console.log('User has artwork:', artworkResponse);
        setUserArtwork(artworkResponse.artwork);
        setHasArtwork(true);
        setCurrentPage('my-artwork');

        // Try to get reflection for this artwork
        try {
          const reflectionResponse = await reflection.getByArtworkId(artworkResponse.artwork.id);
          console.log('User has reflection:', reflectionResponse);
          setUserReflection(reflectionResponse.reflection);
        } catch (reflectionError) {
          console.log('No reflection found:', reflectionError.message);
          setUserReflection(null);
        }
      } catch (artworkError) {
        if (artworkError.message.includes('No artwork found')) {
          console.log('User has no artwork, showing dashboard');
          setHasArtwork(false);
          setUserArtwork(null);
          setUserReflection(null);
          setCurrentPage('dashboard');
        } else {
          console.error('Error fetching artwork:', artworkError);
          setCurrentPage('dashboard');
        }
      }
    } catch (error) {
      console.log('Token invalid, clearing auth:', error.message);
      auth.logout();
      setIsAuthenticated(false);
      setHasArtwork(false);
      setUserArtwork(null);
      setUserReflection(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (userData) => {
    console.log('Auth success, checking artwork status...');
    setIsAuthenticated(true);
    setCurrentUser(userData.user);
    
    // After successful auth, check if user has artwork
    await checkAuthAndArtworkStatus();
  };

  const handleOnboardingComplete = (updatedUser) => {
    // Update user state with completed onboarding
    if (updatedUser) {
      setCurrentUser(updatedUser);
    } else {
      // Fallback: just mark as completed locally
      setCurrentUser(prev => prev ? { ...prev, onboarding_completed: true } : prev);
    }
  };

  const handleResetPasswordComplete = () => {
    // Clear reset password state and redirect to login
    setShowResetPassword(false);
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleArtworkCreated = (newArtwork) => {
    console.log('Artwork created:', newArtwork);
    setUserArtwork(newArtwork);
    setHasArtwork(true);
    // Navigate to My Artwork page to show the newly created artwork
    setCurrentPage('my-artwork');
  };

  const handleArtworkDeleted = () => {
    console.log('Artwork deleted, resetting state');
    setUserArtwork(null);
    setHasArtwork(false);
    setUserReflection(null);
    // Navigate to dashboard to show updated state
    setCurrentPage('dashboard');
  };

  const confirmLogout = () => {
    console.log('Logging out...');
    auth.logout();
    setIsAuthenticated(false);
    setHasArtwork(false);
    setUserArtwork(null);
    setUserReflection(null);
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setShowLogoutConfirm(false);
  };

  const requestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Navigation handler for the new UI
  const handleNavigation = (pageId) => {
    setCurrentPage(pageId);
  };

  // Render the appropriate page content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} onNavigate={handleNavigation} />;
      case 'add-artwork':
        return (
          <AddArtworkPage 
            onArtworkCreated={handleArtworkCreated}
            currentUser={currentUser}
            onLogout={confirmLogout}
            isWithinLayout={true}
            onNavigate={handleNavigation}
          />
        );
      case 'my-artwork':
        return <MyArtwork onNavigate={handleNavigation} onArtworkDeleted={handleArtworkDeleted} currentUser={currentUser} />;
      case 'reflections':
        return <Reflections onNavigate={handleNavigation} currentUser={currentUser} />;
      case 'reflection':
        return (
          <ReflectionPage 
            onLogout={confirmLogout} 
            artwork={userArtwork}
          />
        );
      case 'profile':
        return <Profile currentUser={currentUser} onLogout={confirmLogout} onUserUpdate={setCurrentUser} />;
      case 'settings':
        return <Settings currentUser={currentUser} />;
      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  // Show reset password page if token is present
  if (showResetPassword) {
    return <ResetPasswordPage onNavigateToLogin={handleResetPasswordComplete} />;
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Show main app layout if authenticated
  return (
    <div className="App">
      <Layout
        currentUser={currentUser}
        onLogout={confirmLogout}
        currentPage={currentPage}
        showLogoutConfirm={showLogoutConfirm}
        onNavigate={handleNavigation}
      >
        {renderPageContent()}
      </Layout>
      
      {/* Onboarding overlay */}
      <Onboarding 
        currentUser={currentUser}
        currentPage={currentPage}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: 'var(--color-gray-50)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid var(--color-gray-200)',
    borderTop: '4px solid var(--color-accent)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: 'var(--space-4)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-600)',
  },
};

export default App;