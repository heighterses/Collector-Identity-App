import { useState, useEffect } from 'react';
import { artwork, auth } from '../api.js';

const AddArtworkPage = ({ onArtworkCreated, currentUser, onLogout, isWithinLayout = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      setError('You appear to be offline. Please check your internet connection and try again.');
      return;
    }
    
    setLoading(true);
    setError('');

    // Validation - Image file is required
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
      uploadData.append('imageFile', formData.imageFile);
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

  const isFormValid = formData.imageFile && formData.title.trim();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Add Your Artwork</h1>
        <p className="dashboard-subtitle">Submit one meaningful piece that defines your creative identity</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Image Upload - Hero Section */}
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
          <label className="form-label">Description (Optional)</label>
          <p style={styles.helperText}>
            Optional context about this piece — what it represents, how it was created, or why it matters to you.
          </p>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input form-textarea"
            placeholder="Share the story behind your artwork..."
            rows={4}
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
            'Creating Artwork...'
          ) : (
            'Create Artwork'
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
};

export default AddArtworkPage;