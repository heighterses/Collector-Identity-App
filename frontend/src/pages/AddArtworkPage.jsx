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
      setError('Please upload an image or write a description');
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

      // Reflection + identity generated in background — App.jsx polls for completion
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
    reader.onload = (ev) => setImagePreview(ev.target.result);
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

  // Derived state for UI hints
  const hasImage = !!formData.imageFile;
  const hasDescription = formData.description.trim().length > 0;
  const isFormValid = formData.title.trim() && (hasImage || hasDescription);
  const pieceNumber = artworks.length + 1;

  // ── Loading skeleton ──────────────────────────────────────────
  if (checkingExisting) {
    return (
      <div className="aa-page">
        <div className="aa-grid">
          <div className="ghost-card" style={{ height: 360, borderRadius: 16 }} />
          <div className="ghost-card" style={{ height: 360, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="aa-page">
      <form onSubmit={handleSubmit} className="aa-grid">

        {/* LEFT — Upload canvas */}
        <div className="aa-canvas">
          {!imagePreview ? (
            <div
              className={`aa-dropzone${dragActive ? ' aa-dropzone--active' : ''}`}
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
              <div className="aa-dropzone-icon-badge">
                {hasDescription && !hasImage ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                ) : (
                  <span className="aa-dropzone-plus">+</span>
                )}
              </div>

              <p className="aa-dropzone-primary">
                {hasDescription && !hasImage ? 'Add an image (optional)' : 'Drop artwork here'}
              </p>
              <p className="aa-dropzone-secondary">
                {hasDescription && !hasImage
                  ? 'Your description is enough — or add an image too'
                  : 'Drop a high-resolution image, or browse your files. JPEG, PNG up to 10MB.'}
              </p>
              <p className="aa-dropzone-mono">[ artwork image ]</p>
            </div>
          ) : (
            <div className="aa-preview">
              <img src={imagePreview} alt="Preview" className="aa-preview-img" />
              <button
                type="button"
                className="btn btn-secondary btn-sm aa-preview-clear"
                onClick={clearFile}
              >
                Remove image
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Catalog entry form */}
        <div className="card aa-form-panel">
          <div className="aa-form-head">
            <p className="pattern-eyebrow">Catalog entry</p>
            <span className="aa-piece-number">Piece #{pieceNumber}</span>
          </div>

          <div className="pattern-field">
            <label className="pattern-field-label" htmlFor="artwork-title">Title</label>
            <input
              id="artwork-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="pattern-field-input pattern-field-input--title"
              placeholder="Untitled work"
            />
          </div>

          <div className="pattern-field">
            <label className="pattern-field-label" htmlFor="artwork-description">
              Description
              {!hasImage && (
                <span className="aa-desc-hint">
                  {hasDescription ? ' · used as your artwork' : ' · required if no image'}
                </span>
              )}
            </label>
            <textarea
              id="artwork-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="pattern-field-input aa-textarea"
              placeholder="What drew you to this piece? Note the medium, the moment, the feeling."
              rows={5}
            />
          </div>

          {(hasImage || hasDescription) && (
            <div className="aa-mode">
              {hasImage && hasDescription && (<><span className="aa-mode-dot aa-mode-dot--both" />Image + description</>)}
              {hasImage && !hasDescription && (<><span className="aa-mode-dot aa-mode-dot--image" />Image upload</>)}
              {!hasImage && hasDescription && (<><span className="aa-mode-dot aa-mode-dot--text" />Text description</>)}
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <div className="aa-form-footer">
            <div className="aa-form-count">
              <span className="aa-form-count-num">{artworks.length}</span> work{artworks.length !== 1 ? 's' : ''} in collection
            </div>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="btn btn-primary aa-submit"
            >
              {loading ? (
                <span className="ai-step">
                  <span className="ai-step-dot" />
                  Adding<span className="ai-dots"><span>.</span><span>.</span><span>.</span></span>
                </span>
              ) : 'Add to collection'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddArtworkPage;
