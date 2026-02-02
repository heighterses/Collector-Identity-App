import React, { useState, useEffect } from 'react';
import { auth } from '../api.js';

const Onboarding = ({ currentUser, currentPage, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const onboardingSteps = [
    {
      id: 'dashboard',
      targetPage: 'dashboard',
      title: 'Welcome to Your Dashboard',
      description: 'This is your creative overview where you can see your progress.',
      targetSelector: '.dashboard-title',
      position: 'bottom'
    },
    {
      id: 'add-artwork',
      targetPage: 'dashboard',
      title: 'Add Your First Artwork',
      description: 'Click here to upload and share your creative work.',
      targetSelector: '[data-nav="add-artwork"]',
      position: 'bottom'
    },
    {
      id: 'my-artwork',
      targetPage: 'dashboard',
      title: 'View Your Collection',
      description: 'Access all your uploaded artworks in one place.',
      targetSelector: '[data-nav="my-artwork"]',
      position: 'bottom'
    },
    {
      id: 'reflections',
      targetPage: 'dashboard',
      title: 'Discover Reflections',
      description: 'AI-generated insights appear after you upload artwork.',
      targetSelector: '[data-nav="reflections"]',
      position: 'bottom'
    },
    {
      id: 'profile-settings',
      targetPage: 'dashboard',
      title: 'Manage Your Account',
      description: 'Update your profile and preferences anytime.',
      targetSelector: '[data-nav="profile"]',
      position: 'bottom'
    }
  ];

  // Show onboarding only if user hasn't completed it and is on dashboard
  useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed && currentPage === 'dashboard') {
      // Small delay to ensure page is rendered
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [currentUser, currentPage]);

  // Resume from stored step on refresh
  useEffect(() => {
    const storedStep = localStorage.getItem('onboarding_step');
    if (storedStep && !currentUser?.onboarding_completed) {
      setCurrentStep(parseInt(storedStep, 10));
    }
  }, [currentUser]);

  // Store current step
  useEffect(() => {
    if (isVisible && !currentUser?.onboarding_completed) {
      localStorage.setItem('onboarding_step', currentStep.toString());
    }
  }, [currentStep, isVisible, currentUser]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await auth.completeOnboarding();
      localStorage.removeItem('onboarding_step');
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still hide onboarding on error to prevent blocking
      setIsVisible(false);
    }
  };

  const getCurrentStepData = () => {
    return onboardingSteps[currentStep];
  };

  const getTooltipPosition = () => {
    const step = getCurrentStepData();
    const targetElement = document.querySelector(step.targetSelector);
    
    if (!targetElement) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 120;
    const arrowSize = 8;
    
    let top, left, transform = '';
    
    switch (step.position) {
      case 'bottom':
        top = rect.bottom + arrowSize + 10;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'top':
        top = rect.top - tooltipHeight - arrowSize - 10;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + arrowSize + 10;
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - arrowSize - 10;
        break;
      default:
        top = rect.bottom + arrowSize + 10;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 10) left = 10;
    if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10;
    if (top < 10) top = 10;
    if (top + tooltipHeight > viewportHeight - 10) top = viewportHeight - tooltipHeight - 10;

    return { top: `${top}px`, left: `${left}px` };
  };

  const getArrowStyle = () => {
    const step = getCurrentStepData();
    const baseArrow = {
      position: 'absolute',
      width: 0,
      height: 0,
      border: '8px solid transparent',
    };

    switch (step.position) {
      case 'bottom':
        return {
          ...baseArrow,
          top: '-16px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderBottomColor: 'var(--color-white)',
        };
      case 'top':
        return {
          ...baseArrow,
          bottom: '-16px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderTopColor: 'var(--color-white)',
        };
      case 'right':
        return {
          ...baseArrow,
          top: '50%',
          left: '-16px',
          transform: 'translateY(-50%)',
          borderRightColor: 'var(--color-white)',
        };
      case 'left':
        return {
          ...baseArrow,
          top: '50%',
          right: '-16px',
          transform: 'translateY(-50%)',
          borderLeftColor: 'var(--color-white)',
        };
      default:
        return {
          ...baseArrow,
          top: '-16px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderBottomColor: 'var(--color-white)',
        };
    }
  };

  if (!isVisible || currentUser?.onboarding_completed) {
    return null;
  }

  const stepData = getCurrentStepData();
  const tooltipPosition = getTooltipPosition();
  const arrowStyle = getArrowStyle();

  return (
    <>
      {/* Dimmed background overlay */}
      <div style={styles.overlay} />
      
      {/* Tooltip */}
      <div style={{ ...styles.tooltip, ...tooltipPosition }}>
        <div style={arrowStyle} />
        
        <div style={styles.tooltipContent}>
          <h3 style={styles.tooltipTitle}>{stepData.title}</h3>
          <p style={styles.tooltipDescription}>{stepData.description}</p>
          
          <div style={styles.tooltipActions}>
            <div style={styles.stepIndicator}>
              {currentStep + 1} of {onboardingSteps.length}
            </div>
            
            <div style={styles.actionButtons}>
              <button onClick={handleSkip} style={styles.skipButton}>
                Skip
              </button>
              <button onClick={handleNext} style={styles.nextButton}>
                {currentStep === onboardingSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
    pointerEvents: 'none', // Allow interaction with underlying elements
  },
  tooltip: {
    position: 'fixed',
    width: '280px',
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    padding: 0,
    border: '1px solid var(--color-gray-200)',
  },
  tooltipContent: {
    padding: 'var(--space-4)',
  },
  tooltipTitle: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-900)',
    margin: '0 0 var(--space-2) 0',
    lineHeight: 'var(--line-height-tight)',
  },
  tooltipDescription: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-600)',
    margin: '0 0 var(--space-4) 0',
    lineHeight: 'var(--line-height-normal)',
  },
  tooltipActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-gray-500)',
    fontWeight: 'var(--font-weight-medium)',
  },
  actionButtons: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
  skipButton: {
    background: 'none',
    border: 'none',
    color: 'var(--color-gray-500)',
    fontSize: 'var(--font-size-sm)',
    cursor: 'pointer',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-md)',
    transition: 'color var(--transition-normal)',
  },
  nextButton: {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-white)',
    border: 'none',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    cursor: 'pointer',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    transition: 'background-color var(--transition-normal)',
  },
};

export default Onboarding;