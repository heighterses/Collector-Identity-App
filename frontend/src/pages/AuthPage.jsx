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
            <div style={styles.googleButtonPlaceholder}>
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
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Collector Identity</h1>
          <p style={styles.subtitle}>
            {isLogin ? 'Welcome back to your creative journey' : 'Begin your creative identity exploration'}
          </p>
        </div>

        {successMessage && (
          <div style={styles.success}>{successMessage}</div>
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
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                style={styles.input}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter your email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={styles.passwordInput}
                placeholder="Enter your password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
          >
            {loading ? (
              <>
                <div style={styles.buttonSpinner}></div>
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
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
          >
            {isLogin ? 'Create Account' : 'Sign In'}
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
    background: '#fafafa',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '17px',
    color: '#666',
    lineHeight: '1.5',
  },
  googleButtonContainer: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  googleButtonPlaceholder: {
    padding: '12px 24px',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    color: '#666',
    fontSize: '14px',
    textAlign: 'center',
    width: '100%',
    background: '#f8f9fa',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#e8e8e8',
  },
  dividerText: {
    background: 'white',
    color: '#999',
    fontSize: '14px',
    padding: '0 16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    padding: '16px 20px',
    border: '2px solid #e8e8e8',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    padding: '16px 50px 16px 20px',
    border: '2px solid #e8e8e8',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  submitButton: {
    padding: '18px 24px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  submitButtonDisabled: {
    background: '#d1d5db',
    cursor: 'not-allowed',
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  success: {
    color: '#059669',
    fontSize: '15px',
    textAlign: 'center',
    padding: '16px 20px',
    background: '#f0fdf4',
    borderRadius: '12px',
    border: '1px solid #bbf7d0',
    fontWeight: '500',
    marginBottom: '24px',
  },
  error: {
    color: '#dc2626',
    fontSize: '15px',
    textAlign: 'center',
    padding: '16px 20px',
    background: '#fef2f2',
    borderRadius: '12px',
    border: '1px solid #fecaca',
    fontWeight: '500',
  },
  switchContainer: {
    textAlign: 'center',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #f0f0f0',
  },
  switchText: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '12px',
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#1a1a1a',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '4px 8px',
  },
};

export default AuthPage;