import { useState, useEffect } from 'react';
import { artwork } from '../api.js';
import { formatDate } from '../utils/dateUtils.js';
import ArtworkImage from '../components/ArtworkImage.jsx';

const MyArtwork = ({ onNavigate, onArtworkDeleted, currentUser }) => {
  const [userArtwork, setUserArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reflectionExpanded, setReflectionExpanded] = useState(false);

  useEffect(() => { loadArtwork(); }, []);

  const loadArtwork = async () => {
    setLoading(true); setError('');
    try {
      const data = await artwork.getMine();
      setUserArtwork(data.artwork);
    } catch (err) {
      if (err.message.includes('No artwork found')) setUserArtwork(null);
      else setError(err.message);
    } finally { setLoading(false); }
  };

  const fmtDate = (d) => formatDate(d, currentUser?.timezone || 'UTC', currentUser?.language || 'en');

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await artwork.deleteMine();
      setUserArtwork(null); setShowDeleteConfirm(false);
      if (onArtworkDeleted) onArtworkDeleted();
      if (onNavigate) onNavigate('add-artwork');
    } catch (err) {
      setError(err.message || 'Failed to remove artwork.');
      setShowDeleteConfirm(false);
    } finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="artwork-gallery-page">
        <div className="ghost-cards">
          <div className="ghost-card ghost-card--art" />
          <div className="ghost-card ghost-card--short" style={{ width: '50%' }} />
          <div className="ghost-card ghost-card--short" style={{ width: '70%' }} />
          <div className="ghost-card ghost-card--tall" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="artwork-gallery-page">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 className="empty-state-title">Unable to load</h3>
          <p className="empty-state-description">{error}</p>
          <button onClick={loadArtwork} className="btn btn-primary">Try again</button>
        </div>
      </div>
    );
  }

  if (!userArtwork) {
    return (
      <div className="artwork-gallery-page">
        <div className="artwork-gallery-header">
          <p className="artwork-gallery-eyebrow">Gallery</p>
          <h1 className="artwork-gallery-title">My Artwork</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-frame" />
          <h3 className="empty-state-title">Nothing here yet</h3>
          <p className="empty-state-description">
            Add your first piece to begin. Your artwork will be displayed here as the centerpiece of your collection.
          </p>
          <button onClick={() => onNavigate('add-artwork')} className="btn btn-primary btn-lg">Add artwork</button>
        </div>
      </div>
    );
  }

  return (
    <div className="artwork-gallery-page">
      <div className="artwork-gallery-header">
        <p className="artwork-gallery-eyebrow">Gallery</p>
        <h1 className="artwork-gallery-title">My Artwork</h1>
      </div>

      {/* The artwork — image first, full width */}
      <div className="artwork-display-frame">
        <ArtworkImage
          src={userArtwork.image_url}
          alt={userArtwork.title}
          artworkType={userArtwork.artwork_type}
          variant="full"
        />
      </div>

      {/* Info row */}
      <div className="artwork-info-row">
        <div className="artwork-info-left">
          <h2 className="artwork-info-title">{userArtwork.title}</h2>
          <div className="artwork-info-meta">
            <span style={{ textTransform: 'capitalize' }}>{userArtwork.artwork_type}</span>
            <span>·</span>
            <span>{fmtDate(userArtwork.created_at)}</span>
            {userArtwork.reflection && (
              <>
                <span>·</span>
                <span className="badge badge-green">Reflection ready</span>
              </>
            )}
          </div>
          {userArtwork.description && (
            <p className="artwork-info-desc">{userArtwork.description}</p>
          )}
        </div>
      </div>

      {/* Reflection panel */}
      <div className="artwork-reflection-panel">
        <p className="artwork-reflection-panel-label">Reflection</p>

        {userArtwork.reflection ? (
          <>
            {reflectionExpanded ? (
              <p className="artwork-reflection-text">{userArtwork.reflection.content}</p>
            ) : (
              <p
                className="artwork-reflection-collapsed"
                onClick={() => setReflectionExpanded(true)}
              >
                {userArtwork.reflection.content.substring(0, 200)}… <span style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)' }}>Read more</span>
              </p>
            )}
            <div className="artwork-reflection-meta">
              <span className="artwork-reflection-date">Generated {fmtDate(userArtwork.reflection.created_at)}</span>
              <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                {reflectionExpanded && (
                  <button onClick={() => setReflectionExpanded(false)} className="btn btn-ghost btn-sm">Collapse</button>
                )}
                <button onClick={() => onNavigate('reflections')} className="btn btn-secondary btn-sm">
                  Full reflection →
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="artwork-reflection-generating">
            <div className="spinner" />
            <span>Generating your reflection — this usually takes a few moments.</span>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="danger-zone">
        <div className="danger-zone-info">
          <p className="danger-zone-label">Remove this artwork</p>
          <p className="danger-zone-hint">Deletes artwork and all associated reflections. Cannot be undone.</p>
        </div>
        <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger" disabled={deleting}>
          {deleting ? 'Removing…' : 'Remove'}
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Remove Artwork</h3>
            </div>
            <div className="modal-body">
              <p className="modal-message">Remove &ldquo;{userArtwork?.title}&rdquo;? This will also delete any associated reflections.</p>
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary" disabled={deleting}>Cancel</button>
              <button onClick={confirmDelete} className="btn btn-danger" disabled={deleting}>
                {deleting ? 'Removing…' : 'Remove artwork'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyArtwork;
