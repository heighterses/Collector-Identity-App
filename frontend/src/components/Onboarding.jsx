import { useState, useEffect } from 'react';
import { auth } from '../api.js';

const Onboarding = ({ onComplete, onSkip }) => {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

  // Add hover effects via CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .onboarding-skip:hover {
        color: #666 !important;
        background: rgba(0, 0, 0, 0.05) !important;
      }
      .onboarding-next:hover:not(:disabled) {
        background: #333 !important;
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleNext = () => {
    if (currentScreen < 3) {
      setCurrentScreen(currentScreen + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await auth.completeOnboarding();
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still proceed to avoid blocking the user
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const screens = [
    {
      title: "Welcome to your creative space",
      content: "This is a place for reflection, not performance. Here, you can explore what your creative work means to you, away from the noise of social media.",
      visual: "🎨"
    },
    {
      title: "Here's what happens next",
      content: "You'll add one piece of your work—an image, a description, or both. Then, you'll receive a thoughtful reflection about what it reveals about your creative identity.",
      visual: "✨"
    },
    {
      title: "This is your private space",
      content: "Nothing you share here is public by default. This is your personal creative sanctuary. You're in complete control of your experience.",
      visual: "🔒"
    }
  ];

  const currentScreenData = screens[currentScreen - 1];

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.card}>
          {/* Skip button */}
          <button onClick={handleSkip} style={styles.skipButton} className="onboarding-skip">
            Skip
          </button>

          {/* Progress indicators */}
          <div style={styles.progressContainer}>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  ...styles.progressDot,
                  ...(step === currentScreen ? styles.progressDotActive : {}),
                  ...(step < currentScreen ? styles.progressDotCompleted : {})
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div style={styles.content}>
            <div style={styles.visual}>
              {currentScreenData.visual}
            </div>
            
            <h2 style={styles.title}>
              {currentScreenData.title}
            </h2>
            
            <p style={styles.description}>
              {currentScreenData.content}
            </p>
          </div>

          {/* Navigation */}
          <div style={styles.navigation}>
            <button
              onClick={handleNext}
              disabled={isCompleting}
              className="onboarding-next"
              style={{
                ...styles.nextButton,
                ...(isCompleting ? styles.nextButtonDisabled : {})
              }}
            >
              {currentScreen === 3 
                ? (isCompleting ? 'Getting started...' : 'Add your artwork')
                : 'Continue'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(250, 250, 250, 0.95)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '500px',
  },
  card: {
    background: 'white',
    borderRadius: '24px',
    padding: '48px 40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    position: 'relative',
    textAlign: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  progressContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  progressDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#e8e8e8',
    transition: 'all 0.3s ease',
  },
  progressDotActive: {
    background: '#1a1a1a',
    transform: 'scale(1.2)',
  },
  progressDotCompleted: {
    background: '#059669',
  },
  content: {
    marginBottom: '48px',
  },
  visual: {
    fontSize: '64px',
    marginBottom: '32px',
    lineHeight: 1,
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '20px',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  },
  description: {
    fontSize: '17px',
    color: '#666',
    lineHeight: '1.6',
    margin: 0,
    maxWidth: '400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'center',
  },
  nextButton: {
    padding: '16px 32px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '160px',
  },
  nextButtonDisabled: {
    background: '#d1d5db',
    cursor: 'not-allowed',
  },
};

export default Onboarding;