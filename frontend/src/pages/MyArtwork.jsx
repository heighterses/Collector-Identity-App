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
    <div className="ma-card-img ma-card-img--placeholder">
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
    <div className="ma-card-img">
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
          transition: 'opacity 0.45s ease, transform 0.5s ease',
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

  // Track previous processing IDs so we can detect when they finish
  const prevProcessingIds = useRef(new Set());

  // Initial load: fetch reflection status for all artworks
  useEffect(() => {
    if (!artworks.length) {
      setReflectionMap({});
      setLoadingReflections(false);
      return;
    }
    loadAllReflections();
  }, [artworks.map(a => a.id).join(',')]);

  // Reactive update: when an artwork transitions OUT of 'processing',
  // fetch its reflection immediately without reloading the whole map.
  useEffect(() => {
    const currentProcessingIds = new Set(
      artworks.filter(a => a.status === 'processing').map(a => a.id)
    );

    // Find IDs that were processing on the last render but are no longer
    const justFinished = [...prevProcessingIds.current].filter(
      id => !currentProcessingIds.has(id)
    );

    if (justFinished.length > 0) {
      // Re-check only the newly completed artworks
      justFinished.forEach(id => refreshReflectionForArtwork(id));
    }

    prevProcessingIds.current = currentProcessingIds;
  }, [artworks.map(a => `${a.id}:${a.status}`).join(',')]);

  const refreshReflectionForArtwork = async (artworkId) => {
    try {
      const res = await reflection.getByArtworkId(artworkId);
      const ref = res?.reflection || null;
      setReflectionMap(prev => ({ ...prev, [artworkId]: ref }));
    } catch {
      setReflectionMap(prev => ({ ...prev, [artworkId]: null }));
    }
  };

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
      <div className="ma-page">
        <div className="ma-header">
          <p className="ma-eyebrow">Collection</p>
          <h1 className="ma-title">My Artwork</h1>
          <p className="ma-sub">Your personal gallery of collected works</p>
        </div>
        <div className="ma-empty">
          <div className="ma-empty-frame">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h2 className="ma-empty-title">Start your collection</h2>
          <p className="ma-empty-desc">
            Upload your first artwork to begin shaping your identity
          </p>
          <button className="btn ma-empty-btn" onClick={() => onNavigate('add-artwork')}>
            Add Artwork
          </button>
        </div>
      </div>
    );
  }

  // ── Gallery ──────────────────────────────────────────────────
  return (
    <div className="ma-page">
      <div className="ma-header">
        <div className="ma-header-left">
          <p className="ma-eyebrow">Collection</p>
          <h1 className="ma-title">My Artwork</h1>
          <p className="ma-sub">
            {artworks.length === 1 ? '1 work' : `${artworks.length} works`}
          </p>
        </div>
        <button className="btn ma-add-btn" onClick={() => onNavigate('add-artwork')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add artwork
        </button>
      </div>

      <div className="ma-grid">
        {artworks.map((art) => {
          // ── Processing card ──────────────────────────────────
          if (art.status === 'processing') {
            return (
              <div key={art.id} className="ma-card ma-card--processing">
                <div className="ma-card-img-wrap">
                  {art.image_url ? (
                    <ArtworkCardImage
                      src={art.image_url}
                      alt={art.title || 'Artwork'}
                      artworkType={art.artwork_type}
                    />
                  ) : (
                    <div className="ma-card-img ma-card-img--placeholder">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  {/* Processing overlay */}
                  <div className="ma-processing-overlay">
                    <div className="ma-processing-spinner" />
                    <span className="ma-processing-label">Generating reflection…</span>
                  </div>
                </div>
                <div className="ma-card-body">
                  <div className="ma-card-top">
                    <h3 className="ma-card-title">{art.title || 'Untitled'}</h3>
                    <span className="ma-card-dot ma-card-dot--processing" title="Processing" />
                  </div>
                  <p className="ma-card-date ma-card-date--processing">Analyzing artwork…</p>
                </div>
              </div>
            );
          }

          // ── Normal card ──────────────────────────────────────
          const hasReflection = !!reflectionMap[art.id];
          const reflectionChecked = art.id in reflectionMap;

          return (
            <div key={art.id} className="ma-card">
              {/* Image — main focus */}
              <div className="ma-card-img-wrap">
                <ArtworkCardImage
                  src={art.image_url}
                  alt={art.title || 'Artwork'}
                  artworkType={art.artwork_type}
                />
                {/* Hover overlay with actions */}
                <div className="ma-card-overlay">
                  <button
                    className="ma-overlay-btn ma-overlay-btn--primary"
                    onClick={() => onNavigate('reflection', art.id)}
                  >
                    {hasReflection ? 'View Reflection' : 'Generate Reflection'}
                  </button>
                  <button
                    className="ma-overlay-btn ma-overlay-btn--danger"
                    onClick={() => handleDelete(art.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Info below image */}
              <div className="ma-card-body">
                <div className="ma-card-top">
                  <h3 className="ma-card-title">{art.title || 'Untitled'}</h3>
                  {reflectionChecked && (
                    <span className={`ma-card-dot ${hasReflection ? 'ma-card-dot--on' : 'ma-card-dot--off'}`}
                      title={hasReflection ? 'Reflection ready' : 'No reflection yet'}
                    />
                  )}
                </div>
                <p className="ma-card-date">{formatDate(art.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyArtwork;
