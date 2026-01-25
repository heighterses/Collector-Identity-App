import { useState } from 'react';
import AuthModal from './AuthModal.jsx';

const LandingPage = ({ onAuthSuccess }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignupClick = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleCloseModal = () => {
    setShowAuthModal(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    onAuthSuccess();
  };

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <div className="landing-brand">
            <h1 className="landing-logo">Collector Identity</h1>
          </div>
          <nav className="landing-nav">
            <button 
              onClick={handleLoginClick}
              className="landing-nav-link"
            >
              Log in
            </button>
            <button 
              onClick={handleSignupClick}
              className="landing-nav-button"
            >
              Sign up
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="landing-main">
        <div className="landing-hero">
          <div className="landing-hero-content">
            <div className="landing-hero-text">
              <h1 className="landing-hero-headline">
                Understand your creative work through reflection
              </h1>
              <p className="landing-hero-subline">
                Add your artwork and receive thoughtful interpretations that reveal deeper meaning in your creative practice.
              </p>
              <div className="landing-hero-actions">
                <button 
                  onClick={handleSignupClick}
                  className="landing-cta-primary"
                >
                  Get started
                </button>
                <button className="landing-cta-secondary">
                  Learn more
                </button>
              </div>
            </div>
            
            <div className="landing-hero-visual">
              <div className="landing-animation">
                <div className="floating-artwork">
                  <div className="artwork-frame">
                    <div className="artwork-placeholder"></div>
                  </div>
                  <div className="reflection-bubble">
                    <div className="reflection-text">
                      <div className="reflection-line"></div>
                      <div className="reflection-line short"></div>
                      <div className="reflection-line medium"></div>
                    </div>
                  </div>
                </div>
                
                <div className="floating-elements">
                  <div className="element element-1"></div>
                  <div className="element element-2"></div>
                  <div className="element element-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          mode={authMode}
          onClose={handleCloseModal}
          onAuthSuccess={handleAuthSuccess}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      )}
    </div>
  );
};

export default LandingPage;