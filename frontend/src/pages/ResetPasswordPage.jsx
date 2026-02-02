import { useState, useEffect } from 'react';
import { auth } from '../api.js';

const ResetPasswordPage = ({ onNavigateToLogin }) => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      validateToken(tokenFromUrl);
    } else {
      setError('Invalid reset link');
      setValidatingToken(false);
    }
  }, []);

  const validateToken = async (tokenToValidate) => {
    try {
      setValidatingToken(true);
      const response = await auth.validateResetToken(tokenToValidate);
      setTokenValid(response.valid);
      if (!response.valid) {
        setError('This reset link has expired or is invalid.');
      }
    } catch (err) {
      setError('Unable to validate reset link.');
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await auth.resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        if (onNavigateToLogin) {
          onNavigateToLogin();
        } else {
          window.location.href = '/';
        }
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      window.location.href = '/';
    }
  };

  if (validatingToken) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.title}>Invalid Reset Link</h2>
          <p style={styles.errorText}>
            {error || 'This password reset link has expired or is invalid.'}
          </p>
          <button onClick={goToLogin} style={styles.button}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.title}>Password Reset Successful</h2>
          <p style={styles.successText}>
            Your password has been reset successfully. You will be redirected to the login page.
          </p>
          <button onClick={goToLogin} style={styles.button}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Your Password</h2>
        <p style={styles.subtitle}>Enter your new password below</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}
          
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              style={styles.input}
              required
              minLength={8}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={styles.input}
              required
              minLength={8}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <button onClick={goToLogin} style={styles.linkButton}>
            Back to Login
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
    backgroundColor: 'var(--color-gray-50)',
    padding: 'var(--space-4)',
  },
  card: {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    padding: 'var(--space-8)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-gray-900)',
    marginBottom: 'var(--space-2)',
  },
  subtitle: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-600)',
    marginBottom: 'var(--space-6)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  formGroup: {
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-700)',
    marginBottom: 'var(--space-1)',
  },
  input: {
    width: '100%',
    padding: 'var(--space-3)',
    border: '1px solid var(--color-gray-300)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-base)',
    transition: 'border-color var(--transition-normal)',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: 'var(--space-3)',
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-white)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-normal)',
  },
  buttonDisabled: {
    backgroundColor: 'var(--color-gray-400)',
    cursor: 'not-allowed',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: 'var(--color-accent)',
    fontSize: 'var(--font-size-sm)',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  errorMessage: {
    backgroundColor: 'var(--color-red-50)',
    color: 'var(--color-red-700)',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    border: '1px solid var(--color-red-200)',
  },
  successIcon: {
    fontSize: '3rem',
    marginBottom: 'var(--space-4)',
  },
  errorIcon: {
    fontSize: '3rem',
    marginBottom: 'var(--space-4)',
  },
  successText: {
    color: 'var(--color-green-700)',
    marginBottom: 'var(--space-6)',
  },
  errorText: {
    color: 'var(--color-red-700)',
    marginBottom: 'var(--space-6)',
  },
  loadingText: {
    color: 'var(--color-gray-600)',
    marginTop: 'var(--space-4)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid var(--color-gray-200)',
    borderTop: '3px solid var(--color-accent)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto',
  },
  footer: {
    marginTop: 'var(--space-6)',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--color-gray-200)',
  },
};

export default ResetPasswordPage;