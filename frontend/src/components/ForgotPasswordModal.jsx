import { useState } from 'react';
import { auth } from '../api.js';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      // Always show the same message for security
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSubmitted(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {submitted ? 'Check Your Email' : 'Reset Password'}
          </h2>
          <button onClick={handleClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        <div style={styles.content}>
          {submitted ? (
            <div style={styles.successMessage}>
              <div style={styles.successIcon}>📧</div>
              <p style={styles.successText}>
                If an account exists, a password reset link has been sent to your email.
              </p>
              <button onClick={handleClose} style={styles.button}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              <p style={styles.description}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div style={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.button,
                    ...(loading ? styles.buttonDisabled : {})
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xl)',
    width: '100%',
    maxWidth: '400px',
    margin: 'var(--space-4)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-6)',
    borderBottom: '1px solid var(--color-gray-200)',
  },
  title: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-gray-900)',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: 'var(--color-gray-500)',
    padding: 'var(--space-1)',
  },
  content: {
    padding: 'var(--space-6)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  description: {
    color: 'var(--color-gray-600)',
    fontSize: 'var(--font-size-sm)',
    margin: 0,
    marginBottom: 'var(--space-2)',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  label: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-700)',
  },
  input: {
    padding: 'var(--space-3)',
    border: '1px solid var(--color-gray-300)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-base)',
    transition: 'border-color var(--transition-normal)',
  },
  buttonGroup: {
    display: 'flex',
    gap: 'var(--space-3)',
    marginTop: 'var(--space-2)',
  },
  button: {
    flex: 1,
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
  cancelButton: {
    flex: 1,
    padding: 'var(--space-3)',
    backgroundColor: 'transparent',
    color: 'var(--color-gray-600)',
    border: '1px solid var(--color-gray-300)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    cursor: 'pointer',
    transition: 'all var(--transition-normal)',
  },
  buttonDisabled: {
    backgroundColor: 'var(--color-gray-400)',
    cursor: 'not-allowed',
  },
  errorMessage: {
    backgroundColor: 'var(--color-red-50)',
    color: 'var(--color-red-700)',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    border: '1px solid var(--color-red-200)',
  },
  successMessage: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  successIcon: {
    fontSize: '3rem',
  },
  successText: {
    color: 'var(--color-gray-700)',
    fontSize: 'var(--font-size-base)',
    margin: 0,
    lineHeight: 1.5,
  },
};

export default ForgotPasswordModal;