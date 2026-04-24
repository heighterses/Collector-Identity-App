import React, { useState, useEffect, useRef } from 'react';
import { artwork, reflection } from '../api';

// ── Normalise image_url to a browser-reachable path ─────────────────────────
const normaliseImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('/api/images/')) return src;
  // Internal MinIO URL (http://minio:9000/... or localhost:9002/...)
  if (src.includes('minio:') || src.includes('localhost:9002') || src.includes('localhost:9000')) {
    const match = src.match(/\/artworks\/.+/);
    if (match) return `/api/images${match[0]}`;
    const bucketMatch = src.match(/artworks\/(.+)/);
    if (bucketMatch) return `/api/images/artworks/${bucketMatch[1]}`;
    return null;
  }
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/')) return src;
  return `/api/images/${src}`;
};

// ── Per-card image with loading/error states ─────────────────────────────────
const ArtworkCardImage = ({ src, alt, artworkType }) => {
  const [status, setStatus] = useState('loading');
  const [retried, setRetried] = useState(false);
  const imgRef = useRef(null);
  const isText = artworkType === 'text';
  const normalised = normaliseImageUrl(src);

  useEffect(() => {
    setStatus(isText || !normalised ? 'loaded' : 'loading');
    setRetried(false);
  }, [src, artworkType]);

  const handleError = () => {
    if (!retried && normalised) {
      setRetried(true);
      setTimeout(() => {
        if (imgRef.current) imgRef.current.src = normalised + '?_r=' + Date.now();
      }, 600);
    } else {
      setStatus('error');
    }
  };

  const placeholder = (label) => (
    <div className="artwork-item-image artwork-item-image--placeholder">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span>{label}</span>
    </div>
  );

  if (isText) return placeholder('Text artwork');
  if (!normalised) return placeholder('No image');

  return (
    <div className="artwork-item-image">
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,#1a1a18 25%,#252520 50%,#1a1a18 75%)',
          backgroundSize: '600px 100%',
          animation: 'shimmer 1.8s ease-in-out infinite',
        }} />
      )}
      {status === 'error' && placeholder('Image unavailable')}
      <img
        ref={imgRef}
        src={normalised}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={handleError}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          opacity: status === 'loaded' ? 1 : 0,
          transition: 'opacity 0.45s ease',
          position: status === 'error' ? 'absolute' : 'relative',
        }}
      />
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const MyArtwork = ({ artworks = [], onNavigate, onArtworkDeleted }) => {
  // Track which artworks have reflections
  const [reflectionMap, setReflectionMap] = useState({}); // artworkId → reflection | null
  const [loadingReflections, setLoadingReflections] = useState(true);

  useEffect(() => {
    if (!artworks.length) {
      setReflectionMap({});
      setLoadingReflections(false);
      return;
    }
    loadAllReflections();
  }, [artworks.map(a => a.id).join(',')]);

  const loadAllReflections = async () => {
    setLoadingReflections(true);
    const map = {};
    await Promise.all(
      artworks.map(async (art) => {
        try {
          const res = await reflection.getByArtworkId(art.id);
          map[art.id] = res?.reflection || null;
        } catch {
          map[art.id] = null;
        }
      })
    );
    setReflectionMap(map);
    setLoadingReflections(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this artwork? This cannot be undone.')) return;
    try {
      await artwork.deleteMine(id);
      if (onArtworkDeleted) onArtworkDeleted();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return ''; }
  };

  // ── Empty state ──────────────────────────────────────────────
  if (!artworks.length) {
    return (
      <div className="my-artwork-page">
        <div className="my-artwork-header">
          <p className="my-artwork-eyebrow">Collection</p>
          <h1 className="my-artwork-title">My Artwork</h1>
          <p className="my-artwork-sub">Your personal gallery of collected works</p>
        </div>
        <div className="my-artwork-empty">
          <div className="my-artwork-empty-frame">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h2 className="my-artwork-empty-title">Your gallery awaits</h2>
          <p className="my-artwork-empty-desc">
            Add your first artwork to begin building your collection and generating personal reflections.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('add-artwork')}>
            Add your first artwork
          </button>
        </div>
      </div>
    );
  }

  // ── Gallery ──────────────────────────────────────────────────
  return (
    <div className="my-artwork-page">
      <div className="my-artwork-header">
        <p className="my-artwork-eyebrow">Collection</p>
        <h1 className="my-artwork-title">My Artwork</h1>
        <p className="my-artwork-sub">
          {artworks.length === 1 ? '1 work in your collection' : `${artworks.length} works in your collection`}
        </p>
      </div>

      <div className="my-artwork-grid">
        {artworks.map((art) => {
          const hasReflection = !!reflectionMap[art.id];
          const reflectionChecked = art.id in reflectionMap;

          return (
            <div key={art.id} className="artwork-item-card">
              <ArtworkCardImage
                src={art.image_url}
                alt={art.title || 'Artwork'}
                artworkType={art.artwork_type}
              />

              <div className="artwork-item-body">
                <div className="artwork-item-meta">
                  {art.created_at && (
                    <span className="artwork-item-date">{formatDate(art.created_at)}</span>
                  )}
                  {/* Reflection status badge */}
                  {reflectionChecked && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 'var(--text-xs)', color: hasReflection ? 'var(--success)' : 'var(--gray-400)',
                      marginLeft: 'var(--sp-2)',
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: hasReflection ? 'var(--success)' : 'var(--gray-300)',
                        flexShrink: 0,
                      }} />
                      {hasReflection ? 'Reflected' : 'No reflection'}
                    </span>
                  )}
                </div>

                <h3 className="artwork-item-title">{art.title || 'Untitled'}</h3>

                {art.description && (
                  <p className="artwork-item-desc">{art.description}</p>
                )}

                {/* Reflection preview */}
                {hasReflection && reflectionMap[art.id]?.content && (
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--gray-500)',
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    margin: '0 0 var(--sp-3)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {reflectionMap[art.id].content}
                  </p>
                )}

                <div className="artwork-item-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate('reflection', art.id)}
                  >
                    {hasReflection ? 'View Reflection' : 'Generate Reflection'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(art.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="my-artwork-add-row">
        <button className="btn btn-secondary" onClick={() => onNavigate('add-artwork')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add another artwork
        </button>
      </div>
    </div>
  );
};

export default MyArtwork;
