import { useState, useEffect } from 'react';
import { auth } from '../api.js';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
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

  useEffect(() => {
    // Check if Google library is loaded and initialize
    let retryCount = 0;
    const maxRetries = 20; // Try for up to 4 seconds (20 * 200ms)
    
    const checkGoogleLibrary = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        setGoogleLoaded(true);
        
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id-here',
          callback: handleGoogleSignIn,
          auto_select: false,
        });
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          renderGoogleButton();
        }, 50);
      } else if (retryCount < maxRetries) {
        retryCount++;
        // Retry after a short delay if Google library isn't loaded yet
        setTimeout(checkGoogleLibrary, 200);
      } else {
        console.warn('Google Sign-In library failed to load after multiple attempts');
      }
    };

    checkGoogleLibrary();
  }, []);

  // Re-render Google button when switching between login/signup
  useEffect(() => {
    if (googleLoaded) {
      setTimeout(() => {
        renderGoogleButton();
      }, 50);
    }
  }, [isLogin, googleLoaded]);

  const renderGoogleButton = () => {
    const buttonElement = document.getElementById('google-signin-button');
    if (buttonElement && googleLoaded && window.google && window.google.accounts) {
      // Clear any existing button
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

  const renderGoogleSignInButton = () => {
    return (
      <div style={styles.googleButtonContainer}>
        <div id="google-signin-button">
          {!googleLoaded && (
            <div style={styles.googleButtonPlaceholder} className="shimmer">
              Loading Google Sign-In...
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Basic validation
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
        // ONLY call onAuthSuccess for LOGIN
        onAuthSuccess();
      } else {
        // SIGNUP - user is NOT logged in after signup
        const response = await auth.signup({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim()
        });
        
        // CRITICAL: Do NOT call onAuthSuccess() - user must remain unauthenticated
        // Show success message and switch to login
        setSuccessMessage(response.message);
        setIsLogin(true);
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

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMessage('');
    setShowPassword(false); // Reset password visibility when switching modes
    setFormData({ email: '', password: '', name: '' });
  };

  return (
    <div style={styles.container}>
      {/* Background decorative elements */}
      <div style={styles.backgroundElements}>
        <div style={styles.floatingShape1} className="floating"></div>
        <div style={styles.floatingShape2} className="floating"></div>
        <div style={styles.floatingShape3} className="floating"></div>
      </div>

      <div style={styles.card} className="pinterest-card glass-card">
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <span style={styles.logo} className="icon-hover floating">✨</span>
          </div>
          <h1 style={styles.title} className="gradient-text">
            Collector Identity
          </h1>
          <p style={styles.subtitle}>
            {isLogin ? 'Welcome back to your creative journey' : 'Begin your creative identity exploration'}
          </p>
        </div>

        {successMessage && (
          <div style={styles.success} className="pinterest-card pulse">
            🎉 {successMessage}
          </div>
        )}

        {/* Google Sign-In Button */}
        {renderGoogleSignInButton()}

        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine}></div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.field}>
              <label style={styles.label}>✨ Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                className="form-input"
                style={styles.input}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>📧 Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              style={styles.input}
              placeholder="Enter your email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>🔐 Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
                style={styles.passwordInput}
                placeholder="Enter your password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                className="icon-hover"
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.error} className="pinterest-card pulse">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary icon-hover"
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
          >
            {loading ? (
              <>
                <div className="spinner" style={styles.buttonSpinner}></div>
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              <>
                <span style={styles.buttonIcon}>
                  {isLogin ? '🚀' : '✨'}
                </span>
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        <div style={styles.switchContainer}>
          <p style={styles.switchText}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            type="button"
            onClick={switchMode}
            style={styles.switchButton}
            className="icon-hover"
          >
            {isLogin ? '✨ Create Account' : '🚀 Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #EFEBCE 0%, #E5E0B8 50%, #DBD5A2 100%)',
    backgroundAttachment: 'fixed',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  floatingShape1: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    top: '10%',
    left: '10%',
    animationDelay: '0s',
  },
  floatingShape2: {
    position: 'absolute',
    width: '150px',
    height: '150px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '50%',
    top: '60%',
    right: '15%',
    animationDelay: '2s',
  },
  floatingShape3: {
    position: 'absolute',
    width: '100px',
    height: '100px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '50%',
    bottom: '20%',
    left: '20%',
    animationDelay: '1s',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '30px',
    padding: '50px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  logoContainer: {
    marginBottom: '20px',
  },
  logo: {
    fontSize: '60px',
    display: 'inline-block',
    filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.1))',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    marginBottom: '16px',
    letterSpacing: '-0.02em',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    lineHeight: '1.6',
    fontWeight: '500',
  },
  googleButtonContainer: {
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'center',
  },
  googleButtonPlaceholder: {
    padding: '16px 24px',
    border: '2px solid rgba(239, 235, 206, 0.2)',
    borderRadius: '15px',
    color: '#666',
    fontSize: '14px',
    textAlign: 'center',
    width: '100%',
    background: 'rgba(239, 235, 206, 0.05)',
    fontWeight: '500',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '30px 0',
  },
  dividerLine: {
    flex: 1,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(239, 235, 206, 0.3), transparent)',
  },
  dividerText: {
    background: 'white',
    color: '#999',
    fontSize: '14px',
    padding: '0 20px',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  label: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  input: {
    padding: '18px 24px',
    border: '2px solid rgba(239, 235, 206, 0.2)',
    borderRadius: '18px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'rgba(255, 255, 255, 0.9)',
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    padding: '18px 60px 18px 24px',
    border: '2px solid rgba(239, 235, 206, 0.2)',
    borderRadius: '18px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.9)',
  },
  eyeButton: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  submitButton: {
    padding: '20px 32px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    border: 'none',
    borderRadius: '18px',
  },
  submitButtonDisabled: {
    background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
    cursor: 'not-allowed',
  },
  buttonIcon: {
    fontSize: '18px',
  },
  buttonSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
  },
  success: {
    color: '#059669',
    fontSize: '15px',
    textAlign: 'center',
    padding: '20px 24px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
    borderRadius: '18px',
    border: '2px solid rgba(16, 185, 129, 0.2)',
    fontWeight: '600',
    marginBottom: '30px',
  },
  error: {
    color: '#dc2626',
    fontSize: '15px',
    textAlign: 'center',
    padding: '20px 24px',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
    borderRadius: '18px',
    border: '2px solid rgba(239, 68, 68, 0.2)',
    fontWeight: '600',
  },
  switchContainer: {
    textAlign: 'center',
    marginTop: '40px',
    paddingTop: '30px',
    borderTop: '2px solid rgba(0, 0, 0, 0.05)',
  },
  switchText: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '16px',
    fontWeight: '500',
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#A69B7B',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
  },
};

export default AuthPage;