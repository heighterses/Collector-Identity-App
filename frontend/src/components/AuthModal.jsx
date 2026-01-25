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
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <button 
            onClick={onClose}
            className="auth-modal-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="auth-modal-content">
          {successMessage && (
            <div className="auth-success">
              {successMessage}
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="auth-google">
            <div id="google-signin-button-modal">
              {!googleLoaded && (
                <div className="auth-google-placeholder">
                  Loading Google Sign-In...
                </div>
              )}
            </div>
          </div>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="auth-field">
                <label className="auth-label">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  className="auth-input"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-input"
                placeholder="Enter your email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="auth-input"
                  placeholder="Enter your password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  tabIndex={-1}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-submit"
            >
              {loading ? (
                <>
                  <div className="auth-spinner"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              type="button"
              onClick={handleSwitchMode}
              className="auth-switch-button"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;