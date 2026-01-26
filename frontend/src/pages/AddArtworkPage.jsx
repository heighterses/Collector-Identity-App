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

    // Validation - Image is required
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
      if (err.message.includes('already has an artwork')) {
        setError('You already have an artwork. Redirecting...');
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

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
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

  const clearFile = () => {
    setFormData(prev => ({ ...prev, imageFile: null }));
    setImagePreview(null);
    document.getElementById('imageFile').value = '';
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Add Your Artwork</h1>
        <p className="dashboard-subtitle">Share a piece that represents your creative identity</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          {/* Title - Required */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Give your artwork a title"
            />
          </div>

          {/* Image Upload - Required */}
          <div className="form-group">
            <label className="form-label">Image *</label>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                required
              />
              <label 
                htmlFor="imageFile" 
                className="btn btn-secondary"
                style={{ 
                  cursor: 'pointer',
                  border: '2px dashed var(--color-gray-300)',
                  flex: 1,
                  minWidth: '200px',
                  padding: 'var(--space-4)',
                  textAlign: 'center'
                }}
              >
                {formData.imageFile ? 'Change Image' : 'Choose Image File'}
              </label>
              {formData.imageFile && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="btn btn-ghost"
                  style={{ color: 'var(--color-error)' }}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="form-help">
              Supported formats: JPG, PNG, GIF. Maximum size: 10MB
            </div>
            
            {imagePreview && (
              <div style={{ 
                marginTop: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--color-gray-200)'
              }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '400px',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}
          </div>

          {/* Description - Optional */}
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input form-textarea"
              placeholder="Add context or meaning to your artwork..."
              rows={3}
            />
          </div>

          {error && (
            <div style={{
              padding: 'var(--space-4)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-5)'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isOnline}
            className="btn btn-primary"
            style={{ width: '100%', padding: 'var(--space-4)' }}
          >
            {!isOnline ? (
              'Offline - Check Connection'
            ) : loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', marginRight: 'var(--space-2)' }}></div>
                Creating Artwork...
              </>
            ) : (
              'Create Artwork'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddArtworkPage;