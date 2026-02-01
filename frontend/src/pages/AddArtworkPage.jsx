import { useState, useEffect } from 'react';
import { artwork, auth } from '../api.js';

const AddArtworkPage = ({ onArtworkCreated, currentUser, onLogout, isWithinLayout = false, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [hasExistingArtwork, setHasExistingArtwork] = useState(false);
  const [existingArtwork, setExistingArtwork] = useState(null);
  const [artworkMode, setArtworkMode] = useState('image'); // 'image' or 'text'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageFile: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dragActive, setDragActive] = useState(false);

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

  useEffect(() => {
    checkExistingArtwork();
  }, []);

  const checkExistingArtwork = async () => {
    setCheckingExisting(true);
    try {
      const artworkData = await artwork.getMine();
      setHasExistingArtwork(true);
      setExistingArtwork(artworkData.artwork);
    } catch (err) {
      // No existing artwork found - user can create one
      setHasExistingArtwork(false);
      setExistingArtwork(null);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      setError('You appear to be offline. Please check your internet connection and try again.');
      return;
    }
    
    setLoading(true);
    setError('');

    // Validation based on artwork mode
    if (artworkMode === 'image') {
      // Image mode validation - Image file is required
      if (!formData.imageFile) {
        setError('Please select an image file');
        setLoading(false);
        return;
      }
      
      if (!formData.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }
    } else {
      // Text mode validation - Title and description are required
      if (!formData.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }
      
      if (!formData.description.trim()) {
        setError('Description is required for text-only artwork');
        setLoading(false);
        return;
      }
    }

    // Check token validity before making the request
    try {
      const tokenCheck = await auth.validateToken();
      if (!tokenCheck.valid) {
        setError(`Authentication issue: ${tokenCheck.reason}. Please log in again.`);
        setLoading(false);
        return;
      }
      console.log('Token is valid for user:', tokenCheck.user.email);
    } catch (tokenError) {
      console.log('Token validation error:', tokenError);
      setError('Unable to validate authentication. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('title', formData.title.trim());
      uploadData.append('artwork_type', artworkMode);
      
      if (artworkMode === 'image' && formData.imageFile) {
        uploadData.append('imageFile', formData.imageFile);
      }
      
      if (formData.description.trim()) {
        uploadData.append('description', formData.description.trim());
      }
      
      const result = await artwork.createWithFile(uploadData);
      onArtworkCreated(result.artwork);

    } catch (err) {
      console.log('Full error:', err); // Debug log to see the actual error
      
      if (err.message.includes('already has an artwork')) {
        setError('You already have an artwork. Redirecting...');
        try {
          const existingArtwork = await artwork.getMine();
          onArtworkCreated(existingArtwork.artwork);
        } catch (fetchErr) {
          setError('Unable to load your existing artwork. Please refresh the page.');
        }
      } else if (err.message.includes('Session expired') || err.message.includes('Access token required')) {
        setError('Your session has expired. Please log in again.');
        // Don't auto-reload, let user manually refresh or re-login
      } else {
        // Show the actual error message from the backend/MinIO
        setError(err.message || 'Failed to create artwork. Please try again.');
      }
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

  const handleFileChange = (file) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG or PNG)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Image file must be smaller than 10MB');
        return;
      }

      setFormData(prev => ({ ...prev, imageFile: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      setError('');
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileChange(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setFormData(prev => ({ ...prev, imageFile: null }));
    setImagePreview(null);
    const fileInput = document.getElementById('imageFile');
    if (fileInput) fileInput.value = '';
  };

  const handleModeChange = (mode) => {
    setArtworkMode(mode);
    setError('');
    // Clear image data when switching to text mode
    if (mode === 'text') {
      clearFile();
    }
    // Clear description when switching to image mode (since it becomes optional)
    if (mode === 'image') {
      setFormData(prev => ({ ...prev, description: '' }));
    }
  };

  const isFormValid = artworkMode === 'image' 
    ? (formData.imageFile && formData.title.trim())
    : (formData.title.trim() && formData.description.trim());

  // Show loading state while checking for existing artwork
  if (checkingExisting) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Add Your Artwork</h1>
        </div>
        <div className="empty-state">
          <p>Checking your artwork status...</p>
        </div>
      </div>
    );
  }

  // Show existing artwork message if user already has one
  if (hasExistingArtwork && existingArtwork) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Add Your Artwork</h1>
          <p className="dashboard-subtitle">Milestone 1: One artwork per user</p>
        </div>

        <div style={styles.existingArtworkContainer}>
          <div style={styles.existingArtworkCard}>
            <div style={styles.existingArtworkHeader}>
              <h3 style={styles.existingArtworkTitle}>You already have an artwork</h3>
              <p style={styles.existingArtworkSubtitle}>
                In Milestone 1, each user can have only one artwork. You can view or remove your current artwork to add a new one.
              </p>
            </div>

            <div style={styles.existingArtworkPreview}>
              <div style={styles.existingArtworkMeta}>
                <h4 style={styles.artworkTitle}>"{existingArtwork.title}"</h4>
                {existingArtwork.description && (
                  <p style={styles.artworkDescription}>{existingArtwork.description}</p>
                )}
                <p style={styles.artworkDate}>
                  Created {new Date(existingArtwork.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div style={styles.existingArtworkActions}>
              <button 
                onClick={() => onNavigate && onNavigate('my-artwork')}
                className="btn btn-primary"
                style={styles.actionButton}
              >
                View My Artwork
              </button>
              <button 
                onClick={() => onNavigate && onNavigate('reflections')}
                className="btn btn-secondary"
                style={styles.actionButton}
              >
                View Reflections
              </button>
            </div>

            <div style={styles.futureNote}>
              <p style={styles.futureNoteText}>
                Future versions will support multiple artworks per user.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Add Your Artwork</h1>
        <p className="dashboard-subtitle">Submit one meaningful piece that defines your creative identity</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Mode Toggle */}
        <div style={styles.modeToggle}>
          <div style={styles.toggleButtons}>
            <button
              type="button"
              onClick={() => handleModeChange('image')}
              style={{
                ...styles.toggleButton,
                ...(artworkMode === 'image' ? styles.toggleButtonActive : {})
              }}
            >
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('text')}
              style={{
                ...styles.toggleButton,
                ...(artworkMode === 'text' ? styles.toggleButtonActive : {})
              }}
            >
              Text Description
            </button>
          </div>
        </div>

        {/* Image Upload Section - Only show in image mode */}
        {artworkMode === 'image' && (
          <div style={styles.uploadSection}>
            {!imagePreview ? (
              <div
                style={{
                  ...styles.uploadArea,
                  ...(dragActive ? styles.uploadAreaActive : {})
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('imageFile').click()}
              >
                <input
                  type="file"
                  id="imageFile"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileInputChange}
                  style={styles.hiddenInput}
                />
                
                <div style={styles.uploadContent}>
                  <div style={styles.uploadIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                  </div>
                  <div style={styles.uploadText}>
                    <p style={styles.uploadPrimary}>Click to browse or drag image here</p>
                    <p style={styles.uploadSecondary}>Supported formats: JPG, PNG • Max size: 10MB</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.previewContainer}>
                <div style={styles.imagePreview}>
                  <img
                    src={imagePreview}
                    alt="Artwork preview"
                    style={styles.previewImage}
                  />
                </div>
                <div style={styles.previewActions}>
                  <button
                    type="button"
                    onClick={() => document.getElementById('imageFile').click()}
                    className="btn btn-secondary"
                    style={styles.replaceButton}
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="btn btn-secondary"
                    style={styles.removeButton}
                  >
                    Remove Image
                  </button>
                  <input
                    type="file"
                    id="imageFile"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileInputChange}
                    style={styles.hiddenInput}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title Field */}
        <div className="form-group">
          <label className="form-label">Artwork Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="Artwork title"
            style={styles.titleInput}
          />
        </div>

        {/* Description Field */}
        <div className="form-group">
          <label className="form-label">
            Description {artworkMode === 'text' ? '' : '(Optional)'}
          </label>
          <p style={styles.helperText}>
            {artworkMode === 'text' 
              ? 'Describe your artwork concept, inspiration, or vision in detail.'
              : 'Optional context about this piece — what it represents, how it was created, or why it matters to you.'
            }
          </p>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required={artworkMode === 'text'}
            className="form-input form-textarea"
            placeholder={artworkMode === 'text' 
              ? "Describe your artistic vision, concept, or inspiration..."
              : "Share the story behind your artwork..."
            }
            rows={artworkMode === 'text' ? 6 : 4}
            style={styles.descriptionInput}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.errorContainer}>
            <div style={styles.error}>
              {error}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isOnline || !isFormValid}
          className="btn btn-primary"
          style={{
            ...styles.submitButton,
            ...(loading || !isOnline || !isFormValid ? styles.submitButtonDisabled : {})
          }}
        >
          {!isOnline ? (
            'Offline - Check Connection'
          ) : loading ? (
            artworkMode === 'text' ? 'Creating Artwork from Description...' : 'Creating Artwork...'
          ) : (
            artworkMode === 'text' ? 'Create Artwork from Description' : 'Create Artwork'
          )}
        </button>
      </form>
    </div>
  );
};

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-8)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  modeToggle: {
    marginBottom: 'var(--space-6)',
  },
  toggleButtons: {
    display: 'flex',
    backgroundColor: 'var(--color-gray-100)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-1)',
    gap: 'var(--space-1)',
  },
  toggleButton: {
    flex: 1,
    padding: 'var(--space-3) var(--space-4)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    cursor: 'pointer',
    transition: 'all var(--transition-normal)',
    backgroundColor: 'transparent',
    color: 'var(--color-gray-600)',
  },
  toggleButtonActive: {
    backgroundColor: 'var(--color-white)',
    color: 'var(--color-gray-900)',
    boxShadow: 'var(--shadow-sm)',
  },
  uploadSection: {
    marginBottom: 'var(--space-4)',
  },
  uploadArea: {
    border: '2px dashed var(--color-gray-300)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-12)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all var(--transition-normal)',
    backgroundColor: 'var(--color-gray-50)',
    minHeight: '280px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadAreaActive: {
    borderColor: 'var(--color-accent)',
    backgroundColor: 'rgba(15, 23, 42, 0.02)',
  },
  uploadContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  uploadIcon: {
    color: 'var(--color-gray-400)',
    marginBottom: 'var(--space-2)',
  },
  uploadText: {
    textAlign: 'center',
  },
  uploadPrimary: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-700)',
    margin: '0 0 var(--space-2) 0',
  },
  uploadSecondary: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-500)',
    margin: 0,
  },
  hiddenInput: {
    display: 'none',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  imagePreview: {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--color-gray-200)',
    backgroundColor: 'var(--color-white)',
  },
  previewImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '400px',
    objectFit: 'contain',
    display: 'block',
  },
  previewActions: {
    display: 'flex',
    gap: 'var(--space-3)',
    justifyContent: 'center',
  },
  replaceButton: {
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--font-size-sm)',
  },
  removeButton: {
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-error)',
    borderColor: 'var(--color-error)',
  },
  titleInput: {
    fontSize: 'var(--font-size-lg)',
    padding: 'var(--space-4)',
  },
  helperText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-500)',
    margin: '0 0 var(--space-3) 0',
    lineHeight: 'var(--line-height-relaxed)',
  },
  descriptionInput: {
    resize: 'vertical',
    minHeight: '120px',
  },
  errorContainer: {
    marginTop: 'var(--space-2)',
  },
  error: {
    color: 'var(--color-error)',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'center',
    padding: 'var(--space-4)',
    background: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(220, 38, 38, 0.2)',
  },
  submitButton: {
    width: '100%',
    padding: 'var(--space-4) var(--space-6)',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    marginTop: 'var(--space-4)',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  existingArtworkContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  existingArtworkCard: {
    maxWidth: '500px',
    width: '100%',
    padding: 'var(--space-8)',
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-gray-200)',
    boxShadow: 'var(--shadow-sm)',
    textAlign: 'center',
  },
  existingArtworkHeader: {
    marginBottom: 'var(--space-6)',
  },
  existingArtworkTitle: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-900)',
    margin: '0 0 var(--space-3) 0',
  },
  existingArtworkSubtitle: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-600)',
    lineHeight: 'var(--line-height-relaxed)',
    margin: 0,
  },
  existingArtworkPreview: {
    padding: 'var(--space-6)',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-gray-200)',
    marginBottom: 'var(--space-6)',
  },
  existingArtworkMeta: {
    textAlign: 'left',
  },
  artworkTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-800)',
    margin: '0 0 var(--space-2) 0',
  },
  artworkDescription: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-600)',
    lineHeight: 'var(--line-height-relaxed)',
    margin: '0 0 var(--space-3) 0',
  },
  artworkDate: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-500)',
    margin: 0,
  },
  existingArtworkActions: {
    display: 'flex',
    gap: 'var(--space-3)',
    justifyContent: 'center',
    marginBottom: 'var(--space-6)',
  },
  actionButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
  futureNote: {
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--color-gray-200)',
  },
  futureNoteText: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-gray-400)',
    fontStyle: 'italic',
    margin: 0,
  },
};

export default AddArtworkPage;