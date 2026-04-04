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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await auth.forgotPassword(email);
    } catch {
      // Always show success for security
    } finally {
      setLoading(false);
      setSubmitted(true);
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
    <div className="modal-backdrop" onClick={handleClose} style={{ zIndex: 1100 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="modal-title">{submitted ? 'Check your email' : 'Reset password'}</h3>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: 20, padding: 'var(--sp-1)', borderRadius: 'var(--r-sm)', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0' }}>
              <div style={{ width: 48, height: 48, background: 'var(--success-bg)', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--sp-5)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
              </div>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--gray-700)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>
                If an account exists for that email, a password reset link has been sent.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', margin: 0, lineHeight: 'var(--leading-relaxed)' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="auth-field-group" style={{ marginBottom: 0 }}>
                <label className="auth-field-label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="auth-field-input"
                  required
                />
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          {submitted ? (
            <button onClick={handleClose} className="btn btn-primary" style={{ width: '100%' }}>Close</button>
          ) : (
            <>
              <button type="button" onClick={handleClose} className="btn btn-secondary">Cancel</button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Sending…</>
                ) : 'Send reset link'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
