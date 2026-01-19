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
        <header style={styles.topNav}>
          <div style={styles.topNavContent}>
            <h1 style={styles.appName}>Collector Identity</h1>
            
            <div style={styles.profileSection}>
              {!isOnline && (
                <div style={styles.offlineIndicator}>
                  📡 Offline - Check your connection
                </div>
              )}
              <div style={styles.helpText}>
                Need help? You can always sign out and return later.
              </div>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                style={styles.profileButton}
              >
                <span style={styles.profileName}>{currentUser?.name || 'User'}</span>
                <span style={styles.profileIcon}>👤</span>
              </button>
              
              {profileMenuOpen && (
                <div style={styles.profileMenu}>
                  <div style={styles.profileMenuHeader}>
                    <span style={styles.profileMenuName}>{currentUser?.name}</span>
                    <span style={styles.profileMenuEmail}>{currentUser?.email}</span>
                  </div>
                  <button onClick={handleLogout} style={styles.logoutButton}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div style={isWithinLayout ? styles.layoutMainContent : styles.mainContent}>
        <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Add Your Artwork</h1>
          <p style={styles.subtitle}>
            Share a piece that represents your creative identity
          </p>
          <div style={styles.milestone1Notice}>
            <p style={styles.noticeText}>
              You can add one artwork that will become part of your permanent creative identity.
            </p>
          </div>
        </div>

        {/* Upload Method Toggle */}
        <div style={styles.toggleContainer}>
          <button
            type="button"
            onClick={() => setUploadMethod('file')}
            style={{
              ...styles.toggleButton,
              ...(uploadMethod === 'file' ? styles.toggleButtonActive : {})
            }}
          >
            Upload Image
          </button>
          <button
            type="button"
            onClick={() => setUploadMethod('text')}
            style={{
              ...styles.toggleButton,
              ...(uploadMethod === 'text' ? styles.toggleButtonActive : {})
            }}
          >
            Text Description
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Title - Always Required */}
          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Give your artwork a title"
            />
          </div>

          {/* Image Upload Method */}
          {uploadMethod === 'file' && (
            <div style={styles.field}>
              <label style={styles.label}>Image File *</label>
              <div style={styles.fileInputContainer}>
                <input
                  type="file"
                  id="imageFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                />
                <label htmlFor="imageFile" style={styles.fileInputLabel}>
                  {formData.imageFile ? 'Change Image' : 'Choose Image File'}
                </label>
                {formData.imageFile && (
                  <button
                    type="button"
                    onClick={clearFile}
                    style={styles.clearButton}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              {imagePreview && (
                <div style={styles.imagePreview}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={styles.previewImage}
                  />
                </div>
              )}

              {/* Optional description for image uploads */}
              <div style={styles.field}>
                <label style={styles.label}>Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
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
              <label style={styles.label}>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                style={styles.textarea}
                placeholder="Describe your artwork, its meaning, or the story behind it..."
                rows={6}
              />
            </div>
          )}

          {error && (
            <div style={styles.errorContainer}>
              <div style={styles.error}>{error}</div>
              <div style={styles.errorActions}>
                <button
                  type="button"
                  onClick={handleRetry}
                  style={styles.retryButton}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isOnline}
            style={{
              ...styles.submitButton,
              ...(loading || !isOnline ? styles.submitButtonDisabled : {})
            }}
          >
            {!isOnline ? 'Offline - Check Connection' : 
             loading ? 'Creating Artwork...' : 'Create Artwork'}
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
    background: '#fafafa',
  },
  layoutContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  topNav: {
    background: 'white',
    borderBottom: '1px solid #e8e8e8',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  topNavContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  appName: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
    letterSpacing: '-0.02em',
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
    fontWeight: '500',
    padding: '4px 8px',
    background: '#fef2f2',
    borderRadius: '6px',
    border: '1px solid #fecaca',
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: 'none',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'all 0.2s ease',
  },
  profileName: {
    fontWeight: '500',
  },
  profileIcon: {
    fontSize: '16px',
  },
  profileMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    background: 'white',
    border: '1px solid #e8e8e8',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    minWidth: '200px',
    zIndex: 200,
  },
  profileMenuHeader: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
  },
  profileMenuName: {
    display: 'block',
    fontWeight: '600',
    color: '#1a1a1a',
    fontSize: '14px',
  },
  profileMenuEmail: {
    display: 'block',
    color: '#666',
    fontSize: '12px',
    marginTop: '4px',
  },
  logoutButton: {
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#dc2626',
    fontWeight: '500',
  },
  mainContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    minHeight: 'calc(100vh - 73px)',
  },
  layoutMainContent: {
    padding: '0',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    width: '100%',
    maxWidth: '600px',
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
    fontSize: '18px',
    color: '#666',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  milestone1Notice: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  noticeText: {
    fontSize: '14px',
    color: '#0369a1',
    margin: 0,
    fontWeight: '500',
  },
  toggleContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '32px',
    padding: '4px',
    background: '#f5f5f5',
    borderRadius: '12px',
  },
  toggleButton: {
    flex: 1,
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#666',
  },
  toggleButtonActive: {
    background: 'white',
    color: '#1a1a1a',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
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
  textarea: {
    padding: '16px 20px',
    border: '2px solid #e8e8e8',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  fileInputContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  fileInput: {
    display: 'none',
  },
  fileInputLabel: {
    padding: '16px 24px',
    background: '#f8f9fa',
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    flex: 1,
  },
  clearButton: {
    padding: '8px 16px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  imagePreview: {
    marginTop: '16px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #e8e8e8',
  },
  previewImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '300px',
    objectFit: 'cover',
  },
  submitButton: {
    width: '100%',
    padding: '18px 24px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  submitButtonDisabled: {
    background: '#d1d5db',
    cursor: 'not-allowed',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  errorActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  retryButton: {
    padding: '12px 24px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default AddArtworkPage;