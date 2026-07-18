import { useState, useEffect, useRef } from 'react';
import { reflection, identity, analytics } from '../api.js';
import ProfilePieCharts from '../components/ProfilePieCharts';

// ── Image component — unchanged logic ────────────────────────────────────────
const CardImage = ({ src, alt, artworkType }) => {
  const [status, setStatus] = useState('loading');
  const [retried, setRetried] = useState(false);
  const imgRef = useRef(null);
  const isText = artworkType === 'text';

  const normalizedSrc = (() => {
    if (!src) return null;
    if (src.startsWith('/api/images/')) return src;
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
      <div className="db-art-img">
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
      <div className="db-art-img">
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
    <div className="db-art-img">
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

// ── Metric bar ────────────────────────────────────────────────────────────────
const MetricBar = ({ label, value, max = 10 }) => {
  const pct = Math.min((parseFloat(value) / max) * 100, 100);
  return (
    <div className="db-metric-row">
      <div className="db-metric-header">
        <span className="db-metric-label">{label}</span>
        <span className="db-metric-value">{parseFloat(value).toFixed(1)}</span>
      </div>
      <div className="db-metric-track">
        <div className="db-metric-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ currentUser, artworks = [], onNavigate }) => {
  const [latestReflection, setLatestReflection]   = useState(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [profileData, setProfileData]             = useState(null);
  const [returnBehavior, setReturnBehavior]       = useState(null);

  const latestArtwork = artworks[0] || null;

  useEffect(() => {
    if (!latestArtwork) { setLatestReflection(null); return; }
    loadReflection(latestArtwork.id);
  }, [latestArtwork?.id]);

  useEffect(() => {
    identity.getProfileData().then(setProfileData).catch(() => {});
  }, []);

  // M3-10: internal insight metric, not shown as a personal count/streak —
  // see the stat card below for how it's framed.
  useEffect(() => {
    analytics.getReturnBehavior().then(setReturnBehavior).catch(() => {});
  }, []);

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
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  // ── Derived identity data ─────────────────────────────────────
  const allTraits = profileData?.identities?.flatMap(i => i.traits) || [];
  const coreIdentity = allTraits.find(
    t => (t.type === 'text' || t.trait_type === 'text') && t.label === 'Core Identity'
  );
  const chipTraits = allTraits
    .filter(t => (t.type === 'chip' || t.trait_type === 'chip') && (t.value === 'true' || t.value === '1.0'))
    .slice(0, 6);
  const sliderTraits = allTraits
    .filter(t => (t.type === 'slider' || t.trait_type === 'slider'))
    .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
    .slice(0, 2);
  const firstInsight = profileData?.insights?.[0] || null;

  // ── Empty state ───────────────────────────────────────────────
  if (!latestArtwork) {
    return (
      <div className="db-page">
        <div className="db-banner">
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

  return (
    <div className="db-page">

      {/* ── 1. IDENTITY SNAPSHOT CARD ──────────────────────────── */}
      <div className="db-identity-card">
        <div className="db-identity-left">
          <p className="db-identity-eyebrow">Your Identity</p>
          {coreIdentity?.value ? (
            <p className="db-identity-core">{coreIdentity.value}</p>
          ) : (
            <p className="db-identity-core db-identity-core--empty">
              {greeting()}, {currentUser?.name?.split(' ')[0] || 'there'} — your identity is taking shape.
            </p>
          )}

          {chipTraits.length > 0 && (
            <div className="db-identity-chips">
              {chipTraits.map((t, i) => (
                <span key={i} className="db-identity-chip">{t.label}</span>
              ))}
            </div>
          )}

          {sliderTraits.length > 0 && (
            <div className="db-identity-metrics">
              {sliderTraits.map((t, i) => (
                <MetricBar
                  key={i}
                  label={t.label.replace(' (ML)', '').replace('(ML)', '').trim()}
                  value={t.value}
                />
              ))}
            </div>
          )}
        </div>

        <div className="db-identity-right">
          <button className="btn db-accent-btn btn-sm" onClick={() => onNavigate('identity')}>
            View full identity →
          </button>
          <p className="db-identity-stat">{artworks.length} artwork{artworks.length !== 1 ? 's' : ''}</p>
          <p className="db-identity-stat">{artworks.filter(a => a.has_reflection).length} reflection{artworks.filter(a => a.has_reflection).length !== 1 ? 's' : ''}</p>
          {returnBehavior?.share_2plus_in_window != null && (
            <p className="db-identity-stat">
              Users with 2+ artworks (30d): {(returnBehavior.share_2plus_in_window * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>

      {/* ── 2. LATEST REFLECTION — full width ──────────────────── */}
      {reflectionLoading && (
        <div className="db-reflection-card">
          <p className="db-col-label">Latest Reflection</p>
          <p className="db-reflection-snippet" style={{ color: '#aaa' }}>Loading reflection…</p>
        </div>
      )}

      {!reflectionLoading && latestReflection && (
        <div className="db-reflection-card">
          <div className="db-reflection-card-header">
            <p className="db-col-label">Latest Reflection</p>
            <button className="db-col-link" onClick={() => onNavigate('reflections')}>
              Read full →
            </button>
          </div>
          <p className="db-reflection-full">{latestReflection.content}</p>
        </div>
      )}

      {!reflectionLoading && !latestReflection && (
        <div className="db-reflection-card db-prompt-card">
          <p className="db-prompt-text">
            Generate a reflection for your latest artwork to begin exploring your creative identity.
          </p>
          <button
            className="btn db-accent-btn btn-sm"
            onClick={() => onNavigate('reflection', latestArtwork.id)}
          >
            Generate reflection
          </button>
        </div>
      )}

      {/* ── 3. MAIN 2-COLUMN SECTION ───────────────────────────── */}
      <div className="db-main-grid">

        {/* LEFT — Artworks */}
        <div className="db-artworks-col">
          <div className="db-col-header">
            <p className="db-col-label">Your Artworks</p>
            <button className="db-col-link" onClick={() => onNavigate('my-artwork')}>
              View all →
            </button>
          </div>

          <div className="db-artworks-grid">
            {artworks.slice(0, 6).map((art) => (
              <div
                key={art.id}
                className="db-art-card"
                onClick={() => onNavigate('my-artwork')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate('my-artwork')}
              >
                <CardImage src={art.image_url} alt={art.title} artworkType={art.artwork_type} />
                <div className="db-art-body">
                  <p className="db-art-title">{art.title}</p>
                  <p className="db-art-date">{fmtDate(art.created_at)}</p>
                  {art.has_reflection && (
                    <span className="db-art-tag">Reflection ready</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Sidebar */}
        <div className="db-sidebar-col">

          {profileData?.patterns && (
            <div className="db-sidebar-card">
              <p className="db-sidebar-card-label">Traits Distribution</p>
              <div className="db-chart-wrap">
                <ProfilePieCharts patterns={profileData.patterns} />
              </div>
            </div>
          )}

          {firstInsight && (
            <div className="db-sidebar-card db-insight-card">
              <p className="db-sidebar-card-label">AI Insight</p>
              <p className="db-insight-text">{firstInsight}</p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
