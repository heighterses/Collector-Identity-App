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

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasArtwork, setHasArtwork] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userArtwork, setUserArtwork] = useState(null);
  const [userReflection, setUserReflection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
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
      
      // Set user data from profile response
      if (profileData && profileData.user) {
        setCurrentUser(profileData.user);
      }
    } catch (error) {
      console.log('Token validation failed, trying to refresh...', error.message);
      
      // Try to refresh the token
      try {
        const newToken = await auth.refreshToken();
        if (newToken) {
          console.log('Token refreshed successfully');
          // Try the profile call again with new token
          const profileData = await auth.getProfile();
          console.log('Token valid after refresh, user authenticated:', profileData);
          setIsAuthenticated(true);
          
          if (profileData && profileData.user) {
            setCurrentUser(profileData.user);
          }
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        console.log('Token refresh failed, clearing auth:', refreshError.message);
        // Both original token and refresh failed, clear auth
        auth.logout();
        setIsAuthenticated(false);
        setHasArtwork(false);
        setUserArtwork(null);
        setUserReflection(null);
        setCurrentUser(null);
        setLoading(false);
        return;
      }
    }

    // SINGLE SOURCE OF TRUTH: Always fetch from backend
    try {
      const artworkData = await artwork.getMine();
      setHasArtwork(true);
      setUserArtwork(artworkData.artwork);
      
      // Extract user data from artwork response
      if (artworkData.artwork && artworkData.artwork.user) {
        setCurrentUser(artworkData.artwork.user);
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
      } catch (profileErr) {
        console.error('Failed to load user profile:', profileErr);
        // Fallback user object
        setCurrentUser({
          name: 'User',
          email: 'user@example.com',
          authProvider: 'email'
        });
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

  const handleArtworkDeleted = () => {
    // Reset artwork state when artwork is deleted
    setHasArtwork(false);
    setUserArtwork(null);
    setUserReflection(null);
    // Navigate to dashboard to show updated state
    setCurrentPage('dashboard');
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
    setShowLogoutConfirm(false);
  };

  const confirmLogout = () => {
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
        return <MyArtwork onNavigate={handleNavigation} onArtworkDeleted={handleArtworkDeleted} />;
      case 'reflections':
        return <Reflections onNavigate={handleNavigation} />;
      case 'reflection':
        return (
          <ReflectionPage 
            onLogout={confirmLogout} 
            artwork={userArtwork}
          />
        );
      case 'profile':
        return <Profile currentUser={currentUser} onLogout={confirmLogout} />;
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

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <LandingPage onAuthSuccess={handleAuthSuccess} />;
  }

  // All authenticated users get the enhanced navigation UI
  return (
    <>
      <Layout 
        currentUser={currentUser}
        onLogout={confirmLogout}
        currentPage={currentPage}
        onNavigate={handleNavigation}
        hasArtwork={hasArtwork}
      >
        {renderPageContent()}
      </Layout>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={styles.modalBackdrop} onClick={cancelLogout}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Sign Out</h3>
            </div>
            <div style={styles.modalContent}>
              <p style={styles.modalMessage}>
                Are you sure you want to sign out of your account?
              </p>
            </div>
            <div style={styles.modalActions}>
              <button 
                onClick={cancelLogout}
                className="btn btn-secondary"
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="btn btn-primary"
                style={styles.confirmButton}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
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
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
  },
  modal: {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '400px',
    boxShadow: 'var(--shadow-xl)',
    animation: 'modalSlideIn 0.2s ease-out',
  },
  modalHeader: {
    padding: 'var(--space-6) var(--space-6) var(--space-4) var(--space-6)',
    borderBottom: '1px solid var(--color-gray-200)',
  },
  modalTitle: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-900)',
    margin: 0,
  },
  modalContent: {
    padding: 'var(--space-6)',
  },
  modalMessage: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-700)',
    lineHeight: 'var(--line-height-relaxed)',
    margin: 0,
  },
  modalActions: {
    display: 'flex',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-6) var(--space-6) var(--space-6)',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
  confirmButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
};

// Add CSS animation for spinner and modal
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;
document.head.appendChild(styleSheet);

export default App;