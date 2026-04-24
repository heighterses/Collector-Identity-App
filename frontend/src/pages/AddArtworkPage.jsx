import { useState, useEffect } from 'react';
import { artwork } from '../api.js';

const AddArtworkPage = ({ onArtworkCreated, currentUser, onLogout, isWithinLayout = false, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [artworks, setArtworks] = useState([]);
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

    if (!formData.imageFile && !formData.description.trim()) {
      setError('Please upload an image or add a description');
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
      uploadData.append('artwork_type', formData.imageFile ? 'image' : 'text');
      if (formData.imageFile) {
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

  const isFormValid = formData.title.trim() && (formData.imageFile || formData.description.trim());

  // ── Loading skeleton ──────────────────────────────────────────
  if (checkingExisting) {
    return (
      <div className="add-artwork-page">
        <div className="add-artwork-heading">
          <div className="ghost-card" style={{ height: 36, width: 220, marginBottom: 8 }} />
          <div className="ghost-card" style={{ height: 14, width: 300 }} />
        </div>
        <div className="add-artwork-grid">
          <div className="ghost-card" style={{ height: 360, borderRadius: 12 }} />
          <div className="ghost-card" style={{ height: 360, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="add-artwork-page">

      {/* ── Page heading ─────────────────────────────────────── */}
      <div className="add-artwork-heading">
        <h1 className="add-artwork-title">Place Your Work</h1>
        <p className="add-artwork-sub">
          Upload your artwork and describe its meaning
        </p>
      </div>

      {/* ── 2-column grid ────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="add-artwork-grid">

        {/* LEFT — Upload canvas */}
        <div className="add-artwork-canvas">
          {!imagePreview ? (
            <div
              className={`add-artwork-dropzone${dragActive ? ' add-artwork-dropzone--active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('imageFile').click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  document.getElementById('imageFile').click();
              }}
              aria-label="Upload artwork image"
            >
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <div className="add-artwork-dropzone-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="add-artwork-dropzone-primary">Place your artwork here</p>
              <p className="add-artwork-dropzone-secondary">
                Click or drag &amp; drop · JPG, PNG up to 10MB
              </p>
            </div>
          ) : (
            <div className="add-artwork-preview">
              <img src={imagePreview} alt="Preview" className="add-artwork-preview-img" />
              <button
                type="button"
                className="btn btn-secondary btn-sm add-artwork-preview-clear"
                onClick={clearFile}
              >
                Remove image
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Form panel */}
        <div className="add-artwork-form-panel">

          {/* Collection count */}
          {artworks.length > 0 && (
            <p className="add-artwork-count">
              {artworks.length} artwork{artworks.length !== 1 ? 's' : ''} in your collection
            </p>
          )}

          {/* Title */}
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

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="artwork-description">
              Description
            </label>
            <textarea
              id="artwork-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input form-textarea add-artwork-textarea"
              placeholder="Add context or notes about this work — or describe it if you have no image"
              rows={5}
            />
          </div>

          {/* Error */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="btn btn-primary add-artwork-submit"
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                Adding to collection…
              </>
            ) : 'Add to collection'}
          </button>

        </div>
      </form>
    </div>
  );
};

export default AddArtworkPage;
