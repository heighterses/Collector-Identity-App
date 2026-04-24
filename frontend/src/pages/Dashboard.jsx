import { useState, useEffect, useRef } from 'react';
import { reflection } from '../api.js';

// ── Image component with proper URL normalisation ────────────────────────────
const CardImage = ({ src, alt, artworkType }) => {
  const [status, setStatus] = useState('loading');
  const [retried, setRetried] = useState(false);
  const imgRef = useRef(null);
  const isText = artworkType === 'text';

  // Normalise whatever the backend stored into a browser-reachable URL.
  // Stored values can be:
  //   /api/images/artworks/user-xxx/...   ← proxy path (correct)
  //   http://minio:9000/artworks/...      ← internal Docker URL (broken in browser)
  //   artworks/user-xxx/...              ← bare object key
  const normalizedSrc = (() => {
    if (!src) return null;
    // Already a proxy path
    if (src.startsWith('/api/images/')) return src;
    // Internal MinIO URL — extract the object key and proxy it
    if (src.includes('minio:') || src.includes('localhost:9002') || src.includes('localhost:9000')) {
      const match = src.match(/\/artworks\/.+/);
      if (match) return `/api/images${match[0]}`;
      // Try splitting on bucket name
      const bucketMatch = src.match(/artworks\/(.+)/);
      if (bucketMatch) return `/api/images/artworks/${bucketMatch[1]}`;
      return null;
    }
    // Absolute http/https URL (e.g. public CDN) — use as-is
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    // Relative path starting with /
    if (src.startsWith('/')) return src;
    // Bare object key
    return `/api/images/${src}`;
  })();

  useEffect(() => {
    setStatus(isText || !normalizedSrc ? 'loaded' : 'loading');
    setRetried(false);
  }, [src, artworkType]);

  const handleError = () => {
    if (!retried && normalizedSrc) {
      setRetried(true);
      setTimeout(() => {
        if (imgRef.current) imgRef.current.src = normalizedSrc + '?_r=' + Date.now();
      }, 800);
    } else {
      setStatus('error');
    }
  };

  if (isText) {
    return (
      <div className="dash-card-img">
        <div className="dash-card-img-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>Text artwork</span>
        </div>
      </div>
    );
  }

  if (!normalizedSrc) {
    return (
      <div className="dash-card-img">
        <div className="dash-card-img-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="1"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
          <span>No image</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-card-img">
      {status === 'loading' && <div className="dash-card-img-skeleton" />}
      {status === 'error' && (
        <div className="dash-card-img-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="3" width="18" height="18" rx="1"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
          </svg>
          <span>Image unavailable</span>
        </div>
      )}
      <img
        ref={imgRef}
        src={normalizedSrc}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={handleError}
        style={{ opacity: status === 'loaded' ? 1 : 0, transition: 'opacity 0.5s ease' }}
      />
    </div>
  );
};

// ── Dashboard ────────────────────────────────────────────────────────────────
// Receives artworks from App (single source of truth).
// Fetches reflections for the latest artwork locally.
const Dashboard = ({ currentUser, artworks = [], onNavigate }) => {
  const [latestReflection, setLatestReflection] = useState(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);

  const latestArtwork = artworks[0] || null;

  useEffect(() => {
    if (!latestArtwork) {
      setLatestReflection(null);
      return;
    }
    loadReflection(latestArtwork.id);
  }, [latestArtwork?.id]);

  const loadReflection = async (artworkId) => {
    setReflectionLoading(true);
    try {
      const r = await reflection.getByArtworkId(artworkId);
      setLatestReflection(r?.reflection || null);
    } catch {
      setLatestReflection(null);
    } finally {
      setReflectionLoading(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  const artworkCount = artworks.length;
  const reflectionCount = artworks.filter(a => a.has_reflection).length;

  // ── Empty ────────────────────────────────────────────────────
  if (!latestArtwork) {
    return (
      <div className="dash-page">
        <div className="dash-banner">
          <p className="dash-banner-greeting">{greeting()}, {currentUser?.name?.split(' ')[0] || 'there'}</p>
          <h1 className="dash-banner-title">Your Collection</h1>
          <p className="dash-banner-sub">Nothing added yet</p>
        </div>
        <div className="dash-empty">
          <div className="dash-empty-frame" />
          <h2 className="dash-empty-title">Your gallery awaits</h2>
          <p className="dash-empty-desc">
            Add your first artwork to begin. A thoughtful reflection will be generated for you.
          </p>
          <button onClick={() => onNavigate('add-artwork')} className="btn btn-primary btn-lg">
            Add your first work
          </button>
        </div>
      </div>
    );
  }

  // ── Has artwork ──────────────────────────────────────────────
  const subText = (() => {
    const wLabel = artworkCount === 1 ? '1 work' : `${artworkCount} works`;
    if (reflectionLoading) return `${wLabel} · loading reflection…`;
    if (latestReflection) return `${wLabel} · reflection ready`;
    return `${wLabel} · reflection pending`;
  })();

  return (
    <div className="dash-page">

      {/* ── Banner ── */}
      <div className="dash-banner">
        <p className="dash-banner-greeting">{greeting()}, {currentUser?.name?.split(' ')[0] || 'there'}</p>
        <h1 className="dash-banner-title">Your Collection</h1>
        <p className="dash-banner-sub">{subText}</p>
      </div>

      {/* ── Latest artwork card ── */}
      <div className="dash-section">
        <p className="dash-section-label">
          {artworkCount > 1 ? `Latest · ${artworkCount} total` : 'Artwork'}
        </p>

        <div
          className="dash-card"
          onClick={() => onNavigate('my-artwork')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('my-artwork')}
          aria-label={`View artwork: ${latestArtwork.title}`}
        >
          <CardImage
            src={latestArtwork.image_url}
            alt={latestArtwork.title}
            artworkType={latestArtwork.artwork_type}
          />

          <div className="dash-card-body">
            <h2 className="dash-card-title">{latestArtwork.title}</h2>
            <p className="dash-card-date">{fmtDate(latestArtwork.created_at)}</p>
            <div className="dash-card-sep" />

            {reflectionLoading ? (
              <p className="dash-card-reflection-pending">
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--gray-300)', flexShrink: 0,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                Loading reflection…
              </p>
            ) : latestReflection ? (
              <p className="dash-card-reflection-text">{latestReflection.content}</p>
            ) : (
              <p className="dash-card-reflection-pending">
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--gray-300)', flexShrink: 0,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                Reflection not yet generated
              </p>
            )}

            <div className="dash-card-action">
              <button
                className="dash-card-action-btn"
                onClick={(e) => { e.stopPropagation(); onNavigate('my-artwork'); }}
                tabIndex={-1}
              >
                View collection&nbsp;→
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Latest reflection preview ── */}
      {latestReflection && (
        <div className="dash-section">
          <p className="dash-section-label">Latest reflection</p>
          <div style={{
            padding: 'var(--sp-4) var(--sp-5)',
            background: 'var(--white)',
            border: '1px solid var(--line-soft)',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 1px 3px rgba(13,13,11,0.04)',
          }}>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--gray-500)',
              lineHeight: 1.65,
              margin: '0 0 var(--sp-4)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {latestReflection.content}
            </p>
            <button
              onClick={() => onNavigate('reflections')}
              className="dash-card-action-btn"
            >
              Read full reflection&nbsp;→
            </button>
          </div>
        </div>
      )}

      {/* ── Quick actions when no reflection yet ── */}
      {!latestReflection && !reflectionLoading && (
        <div className="dash-section">
          <p className="dash-section-label">Get started</p>
          <div style={{
            padding: 'var(--sp-5)',
            background: 'var(--white)',
            border: '1px solid var(--line-soft)',
            borderRadius: 'var(--r-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--sp-4)',
          }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', margin: 0 }}>
              Generate a reflection for your artwork to begin exploring your creative identity.
            </p>
            <button
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
              onClick={() => onNavigate('reflection', latestArtwork.id)}
            >
              Generate
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
