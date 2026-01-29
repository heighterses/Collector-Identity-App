import { useState, useEffect } from 'react';
import { auth } from '../api.js';

const AuthModal = ({ mode, onClose, onAuthSuccess, onSwitchMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const isLogin = mode === 'login';

  useEffect(() => {
    // Check if Google library is loaded and initialize
    let retryCount = 0;
    const maxRetries = 20;
    
    const checkGoogleLibrary = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        setGoogleLoaded(true);
        
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id-here',
          callback: handleGoogleSignIn,
          auto_select: false,
        });
        
        setTimeout(() => {
          renderGoogleButton();
        }, 50);
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkGoogleLibrary, 200);
      }
    };

    checkGoogleLibrary();
  }, []);

  useEffect(() => {
    if (googleLoaded) {
      setTimeout(() => {
        renderGoogleButton();
      }, 50);
    }
  }, [mode, googleLoaded]);

  const renderGoogleButton = () => {
    const buttonElement = document.getElementById('google-signin-button-modal');
    if (buttonElement && googleLoaded && window.google && window.google.accounts) {
      buttonElement.innerHTML = '';
      
      try {
        window.google.accounts.id.renderButton(buttonElement, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: isLogin ? 'signin_with' : 'signup_with',
        });
      } catch (error) {
        console.warn('Failed to render Google Sign-In button:', error);
      }
    }
  };

  const handleGoogleSignIn = async (response) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await auth.googleSignIn(response.credential);
      onAuthSuccess();
    } catch (err) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (!isLogin && !formData.name.trim()) {
      setError('Name is required for signup');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await auth.login({ 
          email: formData.email.trim(), 
          password: formData.password 
        });
        onAuthSuccess();
      } else {
        const response = await auth.signup({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim()
        });
        
        setSuccessMessage(response.message);
        onSwitchMode('login');
        setFormData({ email: formData.email, password: '', name: '' });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSwitchMode = () => {
    const newMode = isLogin ? 'signup' : 'login';
    onSwitchMode(newMode);
    setError('');
    setSuccessMessage('');
    setShowPassword(false);
    setFormData({ email: '', password: '', name: '' });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
      <div className="auth-modal">
        <button 
          onClick={onClose}
          className="auth-modal-close"
          aria-label="Close"
        >
          ×
        </button>

        <div className="auth-modal-content">
          {/* Section 1: Page heading */}
          <div className="auth-header-section">
            <h1 className="auth-main-title">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="auth-subtitle">
              {isLogin 
                ? 'Continue your creative journey' 
                : 'Start exploring your artistic identity'
              }
            </p>
          </div>

          {successMessage && (
            <div className="auth-success">
              {successMessage}
            </div>
          )}

          {/* Section 2: Social login buttons */}
          <div className="auth-social-section">
            <div className="auth-google-button">
              <div id="google-signin-button-modal">
                {!googleLoaded && (
                  <div className="auth-google-placeholder">
                    <div className="google-button-skeleton">
                      <div className="google-icon-placeholder"></div>
                      <span>Sign in with Google</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider with subtle "or" */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Section 3: Email & password form */}
          <form onSubmit={handleSubmit} className="auth-form-section">
            {!isLogin && (
              <div className="auth-field-group">
                <label className="auth-field-label">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  className="auth-field-input"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="auth-field-group">
              <label className="auth-field-label">Email address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-field-input"
                placeholder="Enter your email address"
              />
            </div>

            <div className="auth-field-group">
              <label className="auth-field-label">Password</label>
              <div className="auth-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="auth-field-input"
                  placeholder="Enter your password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-visibility"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error-message">
                {error}
              </div>
            )}

            {/* Section 4: Primary CTA button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-primary-button"
            >
              {loading ? (
                <>
                  <div className="auth-loading-spinner"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          {/* Section 5: Secondary actions */}
          <div className="auth-secondary-section">
            {isLogin && (
              <button type="button" className="auth-forgot-password">
                Forgot your password?
              </button>
            )}
            
            <div className="auth-switch-mode">
              <span className="auth-switch-text">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button
                type="button"
                onClick={handleSwitchMode}
                className="auth-switch-link"
              >
                {isLogin ? 'Create account' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;