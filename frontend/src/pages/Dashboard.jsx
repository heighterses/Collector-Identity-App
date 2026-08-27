import { useState, useEffect } from 'react';
import { reflection, identity, analytics } from '../api.js';
import ProfilePieCharts from '../components/ProfilePieCharts';
import { computeReflectionMetrics } from '../utils/reflectionMetrics.js';

// ── Role-specific onboarding quotes for the empty Dashboard state ───────────
const ROLE_QUOTES = {
  artist: {
    before: 'A canvas is a ',
    emphasis: 'mirror',
    after: ' that holds its memory.',
  },
  collector: {
    before: 'A collection is a private museum of the ',
    emphasis: 'soul',
    after: '.',
  },
  enthusiast: {
    before: 'What catches your eye is a whisper from your own ',
    emphasis: 'depths',
    after: '.',
  },
};

// ── Image component — unchanged logic ────────────────────────────────────────
const CardImage = ({ src, alt, artworkType }) => {
  const [status, setStatus] = useState('loading');
  const [retried, setRetried] = useState(false);
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

  const handleError = (e) => {
    if (!retried && normalizedSrc) {
      setRetried(true);
      setTimeout(() => { e.target.src = normalizedSrc + '?_r=' + Date.now(); }, 800);
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
        src={normalizedSrc}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={handleError}
        style={{ opacity: status === 'loaded' ? 1 : 0, transition: 'opacity 0.5s ease' }}
      />
    </div>
  );
};

// ── Reflection-coverage donut — proportion chart, static ratio ──────────────
const CoverageRing = ({ pct }) => (
  <div
    className="pattern-donut db-coverage-ring"
    style={{ background: `conic-gradient(var(--accent) 0 ${pct}%, var(--border-subtle) ${pct}% 100%)` }}
  >
    <div className="pattern-donut-center">
      <div className="pattern-donut-value">{pct}<span className="db-coverage-pct-sign">%</span></div>
      <div className="pattern-donut-sub">reflected</div>
    </div>
  </div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ currentUser, artworks = [], onNavigate }) => {
  const [latestReflection, setLatestReflection]   = useState(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [profileData, setProfileData]             = useState(null);
  const [returnBehavior, setReturnBehavior]       = useState(null);
  // Fix (P1): the same reflection data the Reflections page reads from — a
  // real query against the reflections table (reflection.getAll()), scoped to
  // this user's artworks. Previously the metric row derived its counts from
  // `artwork.has_reflection`, a field the artwork API never actually returns,
  // so it was always 0 regardless of how many reflections existed. Counts are
  // now computed by the shared computeReflectionMetrics() selector so the
  // Dashboard and the Reflections page always report the same numbers.
  const [allReflections, setAllReflections]       = useState([]);
  const [allReflectionsLoading, setAllReflectionsLoading] = useState(true);

  const latestArtwork = artworks[0] || null;

  useEffect(() => {
    if (!latestArtwork) { setLatestReflection(null); return; }
    loadReflection(latestArtwork.id);
  }, [latestArtwork?.id]);

  useEffect(() => {
    identity.getProfileData().then(setProfileData).catch(() => {});
  }, []);

  useEffect(() => {
    setAllReflectionsLoading(true);
    reflection.getAll()
      .then(r => setAllReflections(r?.reflections || []))
      .catch(() => setAllReflections([]))
      .finally(() => setAllReflectionsLoading(false));
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
  const firstInsight = profileData?.insights?.[0] || null;

  // ── Derived metrics ──
  // Reflection counts come from the shared selector so the Dashboard and the
  // Reflections page always agree.
  const { worksCount, totalReflections: reflectionsCount, reflectedWorksCount, coveragePct } =
    computeReflectionMetrics(allReflections, artworks);
  const dominantTone     = profileData?.patterns?.emotions?.[0]?.[0] || null;
  const now               = new Date();
  const thisMonthCount   = artworks.filter(a => {
    if (!a.created_at) return false;
    const d = new Date(a.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const metrics = [
    { label: 'Works', value: worksCount, note: 'in your collection' },
    {
      label: 'Reflections',
      value: allReflectionsLoading ? '—' : reflectionsCount,
      note: allReflectionsLoading ? 'loading…' : `${coveragePct}% of works`,
    },
    ...(dominantTone ? [{ label: 'Dominant tone', value: dominantTone, note: 'most common emotion' }] : []),
    { label: 'This month', value: `+${thisMonthCount}`, note: 'new acquisitions' },
  ];

  // ── Empty state ───────────────────────────────────────────────
  if (!latestArtwork) {
    const roleQuote = ROLE_QUOTES[currentUser?.user_role] || null;

    return (
      <div className="db-page">
        <div className="pattern-empty">
          <div className="pattern-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          {roleQuote ? (
            <blockquote className="pattern-quote pattern-quote--hero db-empty-quote">
              &ldquo;{roleQuote.before}
              <span className="pattern-quote-emphasis">{roleQuote.emphasis}</span>
              {roleQuote.after}&rdquo;
            </blockquote>
          ) : (
            <h2 className="pattern-empty-title">Your gallery awaits</h2>
          )}
          <p className="pattern-empty-desc">
            {greeting()}, {currentUser?.name?.split(' ')[0] || 'there'} — add your first artwork to begin.
            A thoughtful reflection will be generated for you.
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

      {/* ── 1. HERO — pull-quote card ──────────────────────────── */}
      <section className="card db-hero">
        <p className="pattern-eyebrow pattern-eyebrow--accent pattern-eyebrow--hero">Your identity</p>
        {coreIdentity?.value ? (
          <blockquote className="pattern-quote">&ldquo;{coreIdentity.value}&rdquo;</blockquote>
        ) : (
          <blockquote className="pattern-quote db-hero-quote--empty">
            {greeting()}, {currentUser?.name?.split(' ')[0] || 'there'} — your identity is taking shape.
          </blockquote>
        )}
        {chipTraits.length > 0 && (
          <div className="db-hero-chips">
            {chipTraits.map((t, i) => (
              <span key={i} className="pattern-chip pattern-chip--active">{t.label}</span>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. METRIC ROW ───────────────────────────────────────── */}
      <div className="db-metric-row">
        {metrics.map((m, i) => (
          <div key={i} className="pattern-metric-card">
            <div className="pattern-metric-label">{m.label}</div>
            <div className="pattern-metric-value">{m.value}</div>
            <div className="pattern-metric-note">{m.note}</div>
          </div>
        ))}
      </div>

      {/* ── 3. MAIN 2-COLUMN SECTION ───────────────────────────── */}
      <div className="db-main-grid">

        {/* LEFT — Latest reflection + Artworks */}
        <div className="db-left-col">

          {reflectionLoading && (
            <div className="card db-reflection-card">
              <p className="pattern-eyebrow">Latest reflection</p>
              <p className="db-reflection-body db-reflection-body--muted">Loading reflection…</p>
            </div>
          )}

          {!reflectionLoading && latestReflection && (
            <div className="card db-reflection-card">
              <div className="db-reflection-card-header">
                <p className="pattern-eyebrow">Latest reflection</p>
                <button className="db-col-link" onClick={() => onNavigate('reflections')}>
                  Read the catalog →
                </button>
              </div>
              <p className="db-reflection-body">{latestReflection.content}</p>
            </div>
          )}

          {!reflectionLoading && !latestReflection && (
            <div className="card db-prompt-card">
              <p className="db-prompt-text">
                Generate a reflection for your latest artwork to begin exploring your creative identity.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate('reflection', latestArtwork.id)}
              >
                Generate reflection
              </button>
            </div>
          )}

          <div className="db-col-header">
            <p className="pattern-eyebrow">Your artworks</p>
            <button className="db-col-link" onClick={() => onNavigate('my-artwork')}>
              View all →
            </button>
          </div>

          <div className="db-artworks-grid">
            {artworks.slice(0, 6).map((art) => (
              <div
                key={art.id}
                className="card db-art-card"
                onClick={() => onNavigate('my-artwork')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate('my-artwork')}
              >
                <CardImage src={art.image_url} alt={art.title} artworkType={art.artwork_type} />
                <div className="db-art-body">
                  <p className="db-art-title">{art.title}</p>
                  <p className="db-art-date">{fmtDate(art.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Sidebar */}
        <div className="db-sidebar-col">

          <div className="card db-sidebar-card db-sidebar-card--coverage">
            <p className="pattern-eyebrow">Reflection coverage</p>
            <CoverageRing pct={allReflectionsLoading ? 0 : coveragePct} />
            <p className="db-coverage-note">
              {allReflectionsLoading
                ? 'Loading reflections…'
                : `${reflectedWorksCount} of ${worksCount} work${worksCount !== 1 ? 's' : ''} reflected on`}
            </p>
          </div>

          {profileData?.patterns && (
            <div className="card db-sidebar-card">
              <ProfilePieCharts patterns={profileData.patterns} />
            </div>
          )}

          {firstInsight && (
            <div className="card db-sidebar-card db-insight-card">
              <p className="pattern-eyebrow">AI insight</p>
              <p className="db-insight-text">{firstInsight}</p>
            </div>
          )}

          {returnBehavior?.share_2plus_in_window != null && (
            <p className="db-footnote">
              {(returnBehavior.share_2plus_in_window * 100).toFixed(0)}% of collectors have 2+ artworks within 30 days
            </p>
          )}

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
