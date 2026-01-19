import { useState, useEffect } from 'react';
import { auth, artwork, reflection } from './api.js';
import AuthPage from './pages/AuthPage.jsx';
import AddArtworkPage from './pages/AddArtworkPage.jsx';
import ReflectionPage from './pages/ReflectionPage.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyArtwork from './pages/MyArtwork.jsx';
import Reflections from './pages/Reflections.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Onboarding from './components/Onboarding.jsx';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasArtwork, setHasArtwork] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userArtwork, setUserArtwork] = useState(null);
  const [userReflection, setUserReflection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkAuthAndArtworkStatus();
  }, []);

  const checkAuthAndArtworkStatus = async () => {
    setLoading(true);

    // Check if user is authenticated
    if (!auth.isAuthenticated()) {
      // CLEAN STATE RESET on no auth
      setIsAuthenticated(false);
      setHasArtwork(false);
      setUserArtwork(null);
      setUserReflection(null);
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

    // SINGLE SOURCE OF TRUTH: Always fetch from backend
    try {
      const artworkData = await artwork.getMine();
      setHasArtwork(true);
      setUserArtwork(artworkData.artwork);
      
      // Extract user data from artwork response
      if (artworkData.artwork && artworkData.artwork.user) {
        setCurrentUser(artworkData.artwork.user);
        
        // User with artwork has completed onboarding
        setShowOnboarding(false);
      }
      
      // If artwork exists, try to load reflection
      try {
        const reflectionData = await reflection.getMine();
        setUserReflection(reflectionData.reflection);
        
        // Update user data from reflection response if available
        if (reflectionData.reflection && reflectionData.reflection.artwork && reflectionData.reflection.artwork.user) {
          setCurrentUser(reflectionData.reflection.artwork.user);
        }
      } catch (reflectionErr) {
        // No reflection yet, but we have artwork
        setUserReflection(null);
      }
    } catch (err) {
      // User is authenticated but has no artwork
      setHasArtwork(false);
      setUserArtwork(null);
      setUserReflection(null);
      
      // Get user profile for authenticated users without artwork
      try {
        const profileData = await auth.getProfile();
        setCurrentUser(profileData.user);
        
        // Check if user needs onboarding
        if (!profileData.user.onboardingCompleted) {
          setShowOnboarding(true);
        }
      } catch (profileErr) {
        console.error('Failed to load user profile:', profileErr);
        // Fallback user object
        setCurrentUser({
          name: 'User',
          email: 'user@example.com',
          authProvider: 'email',
          onboardingCompleted: false
        });
        setShowOnboarding(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    // Re-check artwork status after auth to ensure consistency
    await checkAuthAndArtworkStatus();
  };

  const handleArtworkCreated = (newArtwork) => {
    // IMMUTABLE STATE: Once artwork is created, it cannot be changed
    setHasArtwork(true);
    setUserArtwork(newArtwork);
    // Navigate to My Artwork page to show the newly created artwork
    setCurrentPage('my-artwork');
  };

  const handleLogout = () => {
    // CLEAN STATE RESET on logout
    auth.logout();
    setIsAuthenticated(false);
    setHasArtwork(false);
    setUserArtwork(null);
    setUserReflection(null);
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setShowOnboarding(false);
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setCurrentUser(prev => prev ? { ...prev, onboardingCompleted: true } : prev);
    // Navigate to Add Artwork page
    setCurrentPage('add-artwork');
  };

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    // Don't mark as completed, but let user proceed
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
            onLogout={handleLogout}
            isWithinLayout={true}
          />
        );
      case 'my-artwork':
        return <MyArtwork />;
      case 'reflections':
        return <Reflections />;
      case 'reflection':
        return (
          <ReflectionPage 
            onLogout={handleLogout} 
            artwork={userArtwork}
          />
        );
      case 'profile':
        return <Profile currentUser={currentUser} />;
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

  // ROUTING LOGIC:
  // 1. Not authenticated → AuthPage
  // 2. Authenticated → Enhanced Navigation UI (Dashboard, etc.)
  // 3. Users can access all pages regardless of artwork status

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // All authenticated users get the enhanced navigation UI
  return (
    <>
      <Layout 
        currentUser={currentUser}
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={handleNavigation}
        hasArtwork={hasArtwork}
      >
        {renderPageContent()}
      </Layout>
      
      {/* Onboarding overlay */}
      {showOnboarding && (
        <Onboarding 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </>
  );

  // Fallback loading state (should not reach here)
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading...</p>
    </div>
  );
};

const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    background: '#fafafa',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e1e1e1',
    borderTop: '3px solid #1a1a1a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#666',
    fontSize: '16px',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default App;