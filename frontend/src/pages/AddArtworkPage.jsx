import { useState, useEffect } from 'react';
import { artwork } from '../api.js';

const AddArtworkPage = ({ onArtworkCreated, currentUser, onLogout, isWithinLayout = false, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [artworks, setArtworks] = useState([]);
  const [artworkMode, setArtworkMode] = useState('image');
  const [formData, setFormData] = useState({ title: '', description: '', imageFile: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => { checkExistingArtwork(); }, []);

  const checkExistingArtwork = async () => {
    setCheckingExisting(true);
    try {
      const d = await artwork.getMine();
      setArtworks(d.artworks || []);
    } catch {
      setArtworks([]);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOnline) { setError('You appear to be offline.'); return; }
    setLoading(true);
    setError('');

    if (artworkMode === 'image' && !formData.imageFile) {
      setError('Please select an image file');
      setLoading(false);
      return;
    }
    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }
    if (artworkMode === 'text' && !formData.description.trim()) {
      setError('Description is required for text artwork');
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
      const newArtwork = result.artwork;

      try {
        await fetch('/api/reflection/regenerate', {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
      } catch (err) {
        console.warn("Reflection generation failed:", err);
      }

      setFormData({ title: '', description: '', imageFile: null });
      setImagePreview(null);
      onArtworkCreated(newArtwork);
    } catch (err) {
      setError(err.message || 'Failed to create artwork. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG or PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }
    setFormData(prev => ({ ...prev, imageFile: file }));
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const clearFile = () => {
    setFormData(prev => ({ ...prev, imageFile: null }));
    setImagePreview(null);
    const fi = document.getElementById('imageFile');
    if (fi) fi.value = '';
  };

  const handleModeChange = (mode) => {
    setArtworkMode(mode);
    setError('');
    if (mode === 'text') clearFile();
    if (mode === 'image') setFormData(prev => ({ ...prev, description: '' }));
  };

  const isFormValid =
    artworkMode === 'image'
      ? (formData.imageFile && formData.title.trim())
      : (formData.title.trim() && formData.description.trim());

  if (checkingExisting) {
    return (
      <div className="gallery-upload-page">
        <div className="gallery-upload-header">
          <h1 className="gallery-upload-title">Place Your Work</h1>
        </div>
        <div className="ghost-cards">
          <div className="ghost-card ghost-card--art" style={{ height: 320 }} />
          <div className="ghost-card ghost-card--short" />
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-upload-page">
      <div className="gallery-upload-header">
        <h1 className="gallery-upload-title">Place Your Work</h1>
        <p className="gallery-upload-sub">
          {artworks.length > 0
            ? `You have ${artworks.length} artwork${artworks.length !== 1 ? 's' : ''} in your collection`
            : 'Add your first artwork to begin'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="gallery-form-fields">
        {/* Mode toggle */}
        <div className="mode-toggle">
          <button
            type="button"
            onClick={() => handleModeChange('image')}
            className={`mode-toggle-btn${artworkMode === 'image' ? ' mode-toggle-btn--active' : ''}`}
          >
            Upload Image
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('text')}
            className={`mode-toggle-btn${artworkMode === 'text' ? ' mode-toggle-btn--active' : ''}`}
          >
            Text Description
          </button>
        </div>

        {/* Upload area */}
        {artworkMode === 'image' && (
          !imagePreview ? (
            <div
              className={`gallery-dropzone${dragActive ? ' gallery-dropzone--active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('imageFile').click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('imageFile').click(); }}
              aria-label="Upload artwork image"
            >
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <div className="dropzone-icon-wrap">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="dropzone-primary">Place your artwork here</p>
              <p className="dropzone-secondary">Click or drag &amp; drop · JPG, PNG up to 10MB</p>
            </div>
          ) : (
            <div className="gallery-preview-frame">
              <img src={imagePreview} alt="Preview" />
              <div className="gallery-preview-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={clearFile}
                >
                  Remove image
                </button>
              </div>
            </div>
          )
        )}

        {/* Title field */}
        <div className="form-group">
          <label className="form-label" htmlFor="artwork-title">Title</label>
          <input
            id="artwork-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            placeholder="Give your artwork a title"
          />
        </div>

        {/* Description field */}
        <div className="form-group">
          <label className="form-label" htmlFor="artwork-description">
            Description
            {artworkMode === 'text' && <span style={{ color: 'var(--error)', marginLeft: 4 }}>*</span>}
          </label>
          <textarea
            id="artwork-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input form-textarea"
            placeholder={
              artworkMode === 'text'
                ? 'Describe your artwork in detail — this will be used to generate your reflection'
                : 'Optional — add context or notes about this work'
            }
            rows={4}
          />
          {artworkMode === 'text' && (
            <p className="form-hint">Describe the artwork in detail. This text will be used to generate your personal reflection.</p>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: 'var(--sp-2)' }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              Adding to collection…
            </>
          ) : 'Add to collection'}
        </button>
      </form>
    </div>
  );
};

export default AddArtworkPage;
