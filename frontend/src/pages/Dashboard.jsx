import { useState, useEffect, useRef } from 'react';
import { artwork, reflection } from '../api.js';

// ── Inline image for the dashboard card ─────────────────────────────────────
const CardImage = ({ src, alt, artworkType }) => {
  const [status, setStatus] = useState('loading');
  const [retried, setRetried] = useState(false);
  const imgRef = useRef(null);
  const isText = artworkType === 'text';

  const normalizedSrc = (() => {
    if (!src) return null;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('/')) return src;
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
const Dashboard = ({ currentUser, onNavigate }) => {
  const [userArtwork, setUserArtwork] = useState(null);
  const [userReflection, setUserReflection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      try {
        const a = await artwork.getMine();
        setUserArtwork(a.artwork);
        try { const r = await reflection.getMine(); setUserReflection(r.reflection); }
        catch { setUserReflection(null); }
      } catch { setUserArtwork(null); setUserReflection(null); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-page">
        {/* Banner skeleton */}
        <div className="dash-skeleton-banner">
          <div className="dash-skeleton-bar" style={{ height: 11, width: 100, marginBottom: 'var(--sp-3)' }} />
          <div className="dash-skeleton-bar" style={{ height: 38, width: 240, marginBottom: 'var(--sp-2)' }} />
          <div className="dash-skeleton-bar" style={{ height: 14, width: 160 }} />
        </div>
        {/* Section label skeleton */}
        <div className="dash-skeleton-bar" style={{ height: 11, width: 80, marginBottom: 'var(--sp-5)' }} />
        {/* Card skeleton */}
        <div className="dash-skeleton-card">
          <div className="dash-skeleton-img" />
          <div className="dash-skeleton-body">
            <div className="dash-skeleton-bar" style={{ height: 20, width: '52%' }} />
            <div className="dash-skeleton-bar" style={{ height: 11, width: '28%' }} />
            <div style={{ height: 1, background: 'var(--line-soft)', margin: 'var(--sp-1) 0' }} />
            <div className="dash-skeleton-bar" style={{ height: 14, width: '88%' }} />
            <div className="dash-skeleton-bar" style={{ height: 14, width: '70%' }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────
  if (!userArtwork) {
    return (
      <div className="dash-page">
        {/* Banner */}
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

  // ── Has artwork ──────────────────────────────────────────
  return (
    <div className="dash-page">

      {/* ── Banner ── */}
      <div className="dash-banner">
        <p className="dash-banner-greeting">{greeting()}, {currentUser?.name?.split(' ')[0] || 'there'}</p>
        <h1 className="dash-banner-title">Your Collection</h1>
        <p className="dash-banner-sub">
          1 work&nbsp;&nbsp;·&nbsp;&nbsp;{userReflection ? '1 reflection' : 'reflection pending'}
        </p>
      </div>

      {/* ── Artwork section ── */}
      <div className="dash-section">
        <p className="dash-section-label">Artwork</p>

        <div
          className="dash-card"
          onClick={() => onNavigate('my-artwork')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('my-artwork')}
          aria-label={`View artwork: ${userArtwork.title}`}
        >
          {/* 1 — Image */}
          <CardImage
            src={userArtwork.image_url}
            alt={userArtwork.title}
            artworkType={userArtwork.artwork_type}
          />

          {/* 2 — Body */}
          <div className="dash-card-body">

            {/* Title + date */}
            <h2 className="dash-card-title">{userArtwork.title}</h2>
            <p className="dash-card-date">{fmtDate(userArtwork.created_at)}</p>

            {/* Separator */}
            <div className="dash-card-sep" />

            {/* Reflection — 2-line clamp */}
            {userReflection ? (
              <p className="dash-card-reflection-text">{userReflection.content}</p>
            ) : (
              <p className="dash-card-reflection-pending">
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--gray-300)', flexShrink: 0,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                Generating reflection…
              </p>
            )}

            {/* Action */}
            <div className="dash-card-action">
              <button
                className="dash-card-action-btn"
                onClick={(e) => { e.stopPropagation(); onNavigate('my-artwork'); }}
                tabIndex={-1}
              >
                View&nbsp;→
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Reflections section ── */}
      {userReflection && (
        <div className="dash-section">
          <p className="dash-section-label">Reflections</p>
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
              {userReflection.content}
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

    </div>
  );
};

export default Dashboard;
