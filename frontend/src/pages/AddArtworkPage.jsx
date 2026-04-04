import { useState, useEffect } from 'react';
import { artwork, auth } from '../api.js';

const AddArtworkPage = ({ onArtworkCreated, currentUser, onLogout, isWithinLayout = false, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [hasExistingArtwork, setHasExistingArtwork] = useState(false);
  const [existingArtwork, setExistingArtwork] = useState(null);
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
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => { checkExistingArtwork(); }, []);

  const checkExistingArtwork = async () => {
    setCheckingExisting(true);
    try { const d = await artwork.getMine(); setHasExistingArtwork(true); setExistingArtwork(d.artwork); }
    catch { setHasExistingArtwork(false); setExistingArtwork(null); }
    finally { setCheckingExisting(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOnline) { setError('You appear to be offline.'); return; }
    setLoading(true); setError('');
    if (artworkMode === 'image' && !formData.imageFile) { setError('Please select an image file'); setLoading(false); return; }
    if (!formData.title.trim()) { setError('Title is required'); setLoading(false); return; }
    if (artworkMode === 'text' && !formData.description.trim()) { setError('Description is required for text artwork'); setLoading(false); return; }
    try {
      const tokenCheck = await auth.validateToken();
      if (!tokenCheck.valid) { setError('Authentication issue. Please log in again.'); setLoading(false); return; }
    } catch { setError('Unable to validate authentication.'); setLoading(false); return; }
    try {
      const uploadData = new FormData();
      uploadData.append('title', formData.title.trim());
      uploadData.append('artwork_type', artworkMode);
      if (artworkMode === 'image' && formData.imageFile) uploadData.append('imageFile', formData.imageFile);
      if (formData.description.trim()) uploadData.append('description', formData.description.trim());
      const result = await artwork.createWithFile(uploadData);
      onArtworkCreated(result.artwork);
    } catch (err) {
      if (err.message.includes('already has an artwork')) {
        try { const ex = await artwork.getMine(); onArtworkCreated(ex.artwork); }
        catch { setError('Unable to load your existing artwork.'); }
      } else { setError(err.message || 'Failed to create artwork. Please try again.'); }
    } finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file (JPG or PNG)'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be smaller than 10MB'); return; }
    setFormData(prev => ({ ...prev, imageFile: file }));
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
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
    setArtworkMode(mode); setError('');
    if (mode === 'text') clearFile();
    if (mode === 'image') setFormData(prev => ({ ...prev, description: '' }));
  };

  const isFormValid = artworkMode === 'image'
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

  if (hasExistingArtwork && existingArtwork) {
    return (
      <div className="gallery-upload-page">
        <div className="gallery-upload-header">
          <h1 className="gallery-upload-title">Place Your Work</h1>
          <p className="gallery-upload-sub">One artwork per collection in this milestone</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="gallery-existing-card">
            <h3>Your gallery already has a work</h3>
            <p>Each collection holds one artwork in Milestone 1. View or remove your current piece to add a new one.</p>
            <div className="gallery-existing-preview">
              <h4>&ldquo;{existingArtwork.title}&rdquo;</h4>
              {existingArtwork.description && (
                <p style={{ marginTop: 'var(--sp-2)', marginBottom: 0 }}>
                  {existingArtwork.description.substring(0, 100)}{existingArtwork.description.length > 100 ? '…' : ''}
                </p>
              )}
              <p style={{ marginTop: 'var(--sp-3)', marginBottom: 0, fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                Added {new Date(existingArtwork.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="gallery-existing-actions">
              <button onClick={() => onNavigate?.('my-artwork')} className="btn btn-primary">View artwork</button>
              <button onClick={() => onNavigate?.('reflections')} className="btn btn-secondary">View reflection</button>
            </div>
            <p className="gallery-future-note">Future versions will support multiple works per collection.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-upload-page">
      <div className="gallery-upload-header">
        <h1 className="gallery-upload-title">Place Your Work</h1>
        <p className="gallery-upload-sub">Add one meaningful piece to your collection</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
        {/* Mode toggle */}
        <div className="mode-toggle">
          <button type="button" onClick={() => handleModeChange('image')} className={`mode-toggle-btn${artworkMode === 'image' ? ' mode-toggle-btn--active' : ''}`}>
            Upload Image
          </button>
          <button type="button" onClick={() => handleModeChange('text')} className={`mode-toggle-btn${artworkMode === 'text' ? ' mode-toggle-btn--active' : ''}`}>
            Text Description
          </button>
        </div>

        {/* Upload area */}
        {artworkMode === 'image' && (
          !imagePreview ? (
            <div
              className={`gallery-dropzone${dragActive ? ' gallery-dropzone--active' : ''}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => document.getElementById('imageFile').click()}
            >
              <input type="file" id="imageFile" accept="image/jpeg,image/jpg,image/png" onChange={(e) => handleFileChange(e.target.files[0])} style={{ display: 'none' }} />
              <div className="dropzone-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="1"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
              </div>
              <p className="dropzone-primary">Place your artwork here</p>
              <p className="dropzone-secondary">Click to browse or drag and drop · JPG, PNG · max 10MB</p>
            </div>
          ) : (
            <div className="gallery-preview-frame">
              <img src={imagePreview} alt="Preview" />
              <div className="gallery-preview-actions">
                <button type="button" onClick={() => document.getElementById('imageFile').click()} className="btn btn-secondary btn-sm">Replace</button>
                <button type="button" onClick={clearFile} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>Remove</button>
                <input type="file" id="imageFile" accept="image/jpeg,image/jpg,image/png" onChange={(e) => handleFileChange(e.target.files[0])} style={{ display: 'none' }} />
              </div>
            </div>
          )
        )}

        {/* Fields */}
        <div className="gallery-form-fields">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Title</label>
            <input
              type="text" name="title" value={formData.title} onChange={handleChange}
              required className="form-input" placeholder="Give your artwork a title"
              style={{ fontSize: 'var(--text-md)' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Description {artworkMode === 'image' && <span style={{ color: 'var(--gray-400)', fontWeight: 'var(--weight-regular)' }}>(optional)</span>}
            </label>
            <p className="form-hint" style={{ marginBottom: 'var(--sp-3)' }}>
              {artworkMode === 'text'
                ? 'Describe your artwork concept, inspiration, or vision in detail.'
                : 'Optional context — what it represents, how it was made, or why it matters.'}
            </p>
            <textarea
              name="description" value={formData.description} onChange={handleChange}
              required={artworkMode === 'text'}
              className="form-input form-textarea"
              placeholder={artworkMode === 'text' ? 'Describe your artistic vision…' : 'Share the story behind your artwork…'}
              rows={artworkMode === 'text' ? 6 : 4}
            />
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          type="submit"
          disabled={loading || !isOnline || !isFormValid}
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
        >
          {!isOnline ? 'Offline — check connection'
            : loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Adding to collection…</>
            : artworkMode === 'text' ? 'Add to collection' : 'Add to collection'}
        </button>
      </form>
    </div>
  );
};

export default AddArtworkPage;
