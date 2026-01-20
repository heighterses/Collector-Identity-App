import { useState, useEffect } from 'react';
import { artwork, auth } from '../api.js';

const AddArtworkPage = ({ onArtworkCreated, currentUser, onLogout, isWithinLayout = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'text'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageFile: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    auth.logout();
    onLogout();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is online
    if (!isOnline) {
      setError('You appear to be offline. Please check your internet connection and try again.');
      return;
    }
    
    setLoading(true);
    setError('');

    // CRITICAL VALIDATION: Must have either file OR description
    const hasFile = formData.imageFile !== null;
    const hasDescription = formData.description.trim().length > 0;

    if (!hasFile && !hasDescription) {
      setError('Please provide either an image file or a text description');
      setLoading(false);
      return;
    }

    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    try {
      let result;

      if (hasFile) {
        // Create FormData for file upload
        const uploadData = new FormData();
        uploadData.append('title', formData.title.trim());
        uploadData.append('imageFile', formData.imageFile);
        if (hasDescription) {
          uploadData.append('description', formData.description.trim());
        }
        
        result = await artwork.createWithFile(uploadData);
      } else {
        // Text-only artwork
        result = await artwork.create({
          title: formData.title.trim(),
          description: formData.description.trim(),
          imageUrl: null
        });
      }

      // SUCCESS: IMMUTABLE artwork created - move to reflection
      onArtworkCreated(result.artwork);

    } catch (err) {
      // HANDLE SPECIFIC API ERRORS
      if (err.message.includes('already has an artwork')) {
        // This should not happen due to routing guards, but handle gracefully
        setError('You already have an artwork. Redirecting...');
        // Try to fetch existing artwork and redirect
        try {
          const existingArtwork = await artwork.getMine();
          onArtworkCreated(existingArtwork.artwork);
        } catch (fetchErr) {
          setError('Unable to load your existing artwork. Please refresh the page.');
        }
      } else if (err.message.includes('required')) {
        setError('Please fill in all required fields');
      } else {
        setError(err.message || 'Failed to create artwork. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file must be smaller than 10MB');
        return;
      }

      setFormData(prev => ({ ...prev, imageFile: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      setError('');
    }
  };

  const clearFile = () => {
    setFormData(prev => ({ ...prev, imageFile: null }));
    setImagePreview(null);
    document.getElementById('imageFile').value = '';
  };

  return (
    <div style={isWithinLayout ? styles.layoutContainer : styles.container}>
      {/* Top Navigation Bar - only show if not within Layout */}
      {!isWithinLayout && (
        <header style={styles.topNav} className="glass-card">
          <div style={styles.topNavContent}>
            <h1 style={styles.appName} className="gradient-text">✨ Collector Identity</h1>
            
            <div style={styles.profileSection}>
              {!isOnline && (
                <div style={styles.offlineIndicator} className="pulse">
                  📡 Offline - Check your connection
                </div>
              )}
              <div style={styles.helpText}>
                Need help? You can always sign out and return later.
              </div>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                style={styles.profileButton}
                className="icon-hover"
              >
                <span style={styles.profileName}>{currentUser?.name || 'User'}</span>
                <span style={styles.profileIcon} className="icon-hover">👤</span>
              </button>
              
              {profileMenuOpen && (
                <div style={styles.profileMenu} className="pinterest-card backdrop-blur">
                  <div style={styles.profileMenuHeader}>
                    <span style={styles.profileMenuName}>{currentUser?.name}</span>
                    <span style={styles.profileMenuEmail}>{currentUser?.email}</span>
                  </div>
                  <button onClick={handleLogout} style={styles.logoutButton} className="icon-hover">
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div style={isWithinLayout ? styles.layoutMainContent : styles.mainContent}>
        <div style={styles.card} className="pinterest-card">
          <div style={styles.header}>
            <div style={styles.iconContainer} className="floating">
              <span style={styles.headerIcon} className="icon-hover">🎨</span>
            </div>
            <h1 style={styles.title} className="gradient-text">Add Your Artwork</h1>
            <p style={styles.subtitle}>
              Share a piece that represents your creative identity
            </p>
            <div style={styles.milestone1Notice} className="glass-card">
              <span style={styles.noticeIcon} className="icon-hover floating">💡</span>
              <p style={styles.noticeText}>
                You can add one artwork that will become part of your permanent creative identity.
              </p>
            </div>
          </div>

          {/* Upload Method Toggle */}
          <div style={styles.toggleContainer} className="glass-card">
            <button
              type="button"
              onClick={() => setUploadMethod('file')}
              className="icon-hover"
              style={{
                ...styles.toggleButton,
                ...(uploadMethod === 'file' ? styles.toggleButtonActive : {})
              }}
            >
              <span style={styles.toggleIcon}>🖼️</span>
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('text')}
              className="icon-hover"
              style={{
                ...styles.toggleButton,
                ...(uploadMethod === 'text' ? styles.toggleButtonActive : {})
              }}
            >
              <span style={styles.toggleIcon}>📝</span>
              Text Description
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Title - Always Required */}
            <div style={styles.field}>
              <label style={styles.label}>✨ Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input"
                style={styles.input}
                placeholder="Give your artwork a magical title"
              />
            </div>

            {/* Image Upload Method */}
            {uploadMethod === 'file' && (
              <div style={styles.field}>
                <label style={styles.label}>🖼️ Image File *</label>
                <div style={styles.fileInputContainer}>
                  <input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={styles.fileInput}
                  />
                  <label htmlFor="imageFile" style={styles.fileInputLabel} className="icon-hover">
                    <span style={styles.uploadIcon}>
                      {formData.imageFile ? '🔄' : '📁'}
                    </span>
                    {formData.imageFile ? 'Change Image' : 'Choose Image File'}
                  </label>
                  {formData.imageFile && (
                    <button
                      type="button"
                      onClick={clearFile}
                      style={styles.clearButton}
                      className="icon-hover"
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>
                
                {imagePreview && (
                  <div style={styles.imagePreview} className="image-hover pinterest-card">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={styles.previewImage}
                    />
                    <div style={styles.previewOverlay}>
                      <span style={styles.previewIcon} className="floating">✨</span>
                    </div>
                  </div>
                )}

                {/* Optional description for image uploads */}
                <div style={styles.field}>
                  <label style={styles.label}>📝 Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-input"
                    style={styles.textarea}
                    placeholder="Add context or meaning to your image..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Text Description Method */}
            {uploadMethod === 'text' && (
              <div style={styles.field}>
                <label style={styles.label}>📝 Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="form-input"
                  style={styles.textarea}
                  placeholder="Describe your artwork, its meaning, or the story behind it..."
                  rows={6}
                />
              </div>
            )}

            {error && (
              <div style={styles.errorContainer}>
                <div style={styles.error} className="pinterest-card pulse">
                  ⚠️ {error}
                </div>
                <div style={styles.errorActions}>
                  <button
                    type="button"
                    onClick={handleRetry}
                    style={styles.retryButton}
                    className="btn-primary icon-hover"
                  >
                    🔄 Try Again
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isOnline}
              className="btn-primary icon-hover"
              style={{
                ...styles.submitButton,
                ...(loading || !isOnline ? styles.submitButtonDisabled : {})
              }}
            >
              {!isOnline ? (
                <>
                  <span style={styles.buttonIcon}>📡</span>
                  Offline - Check Connection
                </>
              ) : loading ? (
                <>
                  <div className="spinner" style={styles.buttonSpinner}></div>
                  Creating Masterpiece...
                </>
              ) : (
                <>
                  <span style={styles.buttonIcon}>✨</span>
                  Create Artwork
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #EFEBCE 0%, #E5E0B8 50%, #DBD5A2 100%)',
    backgroundAttachment: 'fixed',
  },
  layoutContainer: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  topNav: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '0 0 25px 25px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    margin: '0 20px',
    marginBottom: '20px',
  },
  topNavContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  appName: {
    fontSize: '28px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.02em',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  profileSection: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  offlineIndicator: {
    fontSize: '14px',
    color: '#dc2626',
    fontWeight: '600',
    padding: '8px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '20px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  helpText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'white',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
  },
  profileName: {
    fontWeight: '600',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
  },
  profileIcon: {
    fontSize: '18px',
  },
  profileMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '12px',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    minWidth: '220px',
    zIndex: 200,
    overflow: 'hidden',
  },
  profileMenuHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    background: 'linear-gradient(135deg, rgba(239, 235, 206, 0.1), rgba(229, 224, 184, 0.1))',
  },
  profileMenuName: {
    display: 'block',
    fontWeight: '700',
    color: '#1a1a1a',
    fontSize: '16px',
    marginBottom: '4px',
  },
  profileMenuEmail: {
    display: 'block',
    color: '#666',
    fontSize: '13px',
  },
  logoutButton: {
    width: '100%',
    padding: '16px 20px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '15px',
    color: '#dc2626',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  mainContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    minHeight: 'calc(100vh - 140px)',
  },
  layoutMainContent: {
    padding: '0',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '30px',
    padding: '50px',
    width: '100%',
    maxWidth: '700px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  iconContainer: {
    marginBottom: '20px',
  },
  headerIcon: {
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
    marginBottom: '20px',
    fontWeight: '500',
  },
  milestone1Notice: {
    background: 'linear-gradient(135deg, rgba(239, 235, 206, 0.1), rgba(229, 224, 184, 0.1))',
    border: '1px solid rgba(239, 235, 206, 0.2)',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  noticeIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  noticeText: {
    fontSize: '14px',
    color: '#A69B7B',
    margin: 0,
    fontWeight: '600',
  },
  toggleContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '40px',
    padding: '8px',
    background: 'rgba(239, 235, 206, 0.1)',
    borderRadius: '20px',
    border: '1px solid rgba(239, 235, 206, 0.2)',
  },
  toggleButton: {
    flex: 1,
    padding: '16px 20px',
    background: 'transparent',
    border: 'none',
    borderRadius: '15px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  toggleIcon: {
    fontSize: '18px',
  },
  toggleButtonActive: {
    background: 'white',
    color: '#1a1a1a',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '16px',
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
  textarea: {
    padding: '18px 24px',
    border: '2px solid rgba(239, 235, 206, 0.2)',
    borderRadius: '18px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.6',
    background: 'rgba(255, 255, 255, 0.9)',
  },
  fileInputContainer: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fileInput: {
    display: 'none',
  },
  fileInputLabel: {
    padding: '18px 28px',
    background: 'linear-gradient(135deg, rgba(239, 235, 206, 0.1), rgba(229, 224, 184, 0.1))',
    border: '2px dashed rgba(239, 235, 206, 0.3)',
    borderRadius: '18px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    flex: 1,
    minWidth: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  uploadIcon: {
    fontSize: '20px',
  },
  clearButton: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '15px',
    color: '#dc2626',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  imagePreview: {
    marginTop: '20px',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '2px solid rgba(239, 235, 206, 0.2)',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '400px',
    objectFit: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  previewIcon: {
    fontSize: '20px',
  },
  submitButton: {
    width: '100%',
    padding: '20px 32px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
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
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
  errorActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  retryButton: {
    padding: '14px 28px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
  },
};

// Add hover effect for image preview overlay
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .image-hover:hover .previewOverlay {
    opacity: 1;
  }
`;
document.head.appendChild(styleSheet);

export default AddArtworkPage;