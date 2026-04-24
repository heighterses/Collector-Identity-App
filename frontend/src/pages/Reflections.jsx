import { useState, useEffect } from 'react';
import { reflection } from '../api.js';
import { formatDate } from '../utils/dateUtils.js';

// ── Normalise image URL (same logic as Dashboard/MyArtwork) ─────────────────
const normaliseImageUrl = (src) => {
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
};

// ── Single reflection reading view ──────────────────────────────────────────
const ReflectionReader = ({ reflectionData, currentUser, onRefine, onRegenerate, loadingAI, aiAction }) => {
  const [userInput, setUserInput] = useState('');
  const fmtDate = (d) => formatDate(d, currentUser?.timezone || 'UTC', currentUser?.language || 'en');

  return (
    <div className="reflections-body-wrap">
      {/* Artwork thumbnail */}
      {reflectionData.artwork?.image_url && (
        <div style={{
          width: '100%', height: 180, overflow: 'hidden',
          borderRadius: 'var(--r-xs)', marginBottom: 'var(--sp-6)',
          background: 'var(--gray-800)',
        }}>
          <img
            src={normaliseImageUrl(reflectionData.artwork.image_url)}
            alt={reflectionData.artwork.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div className="reflections-body">
        <p className="reflections-text">{reflectionData.content}</p>
      </div>

      {reflectionData.created_at && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 'var(--sp-8)' }}>
          {fmtDate(reflectionData.created_at)}
        </p>
      )}

      <div className="reflections-ai-panel">
        <div className="reflections-ai-label">
          <span className="reflections-ai-pulse" />
          Refine with AI
        </div>
        <textarea
          className="reflections-ai-textarea"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Share a thought, feeling, or direction to refine this reflection…"
          rows={4}
          disabled={loadingAI}
        />
        <div className="reflections-ai-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { onRefine(reflectionData.id, userInput); setUserInput(''); }}
            disabled={loadingAI || !userInput.trim()}
          >
            {loadingAI && aiAction === 'refine' ? (
              <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />Refining…</>
            ) : 'Refine'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onRegenerate(reflectionData.artwork_id)}
            disabled={loadingAI}
          >
            {loadingAI && aiAction === 'regenerate' ? (
              <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />Regenerating…</>
            ) : 'Regenerate'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Reflections page ────────────────────────────────────────────────────
const Reflections = ({ onNavigate, currentUser, artworks = [] }) => {
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAction, setAiAction] = useState('');

  useEffect(() => {
    loadAllReflections();
  }, [artworks.map(a => a.id).join(',')]);

  const loadAllReflections = async () => {
    setLoading(true);
    try {
      // Fetch reflections for every artwork in parallel
      const results = await Promise.all(
        artworks.map(async (art) => {
          try {
            const res = await reflection.getByArtworkId(art.id);
            return res?.reflection || null;
          } catch {
            return null;
          }
        })
      );
      const valid = results.filter(Boolean);
      setReflections(valid);
      // Auto-select the first one
      if (valid.length > 0 && !selectedId) {
        setSelectedId(valid[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async (reflectionId, userInput) => {
    if (!userInput.trim() || !reflectionId) return;
    setLoadingAI(true);
    setAiAction('refine');
    try {
      const res = await reflection.refine(reflectionId, userInput);
      if (res?.reflection) {
        setReflections(prev =>
          prev.map(r => r.id === reflectionId ? res.reflection : r)
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
      setAiAction('');
    }
  };

  const handleRegenerate = async (artworkId) => {
    setLoadingAI(true);
    setAiAction('regenerate');
    try {
      const res = await reflection.generateForArtwork(artworkId);
      if (res?.reflection) {
        setReflections(prev => {
          const exists = prev.find(r => r.artwork_id === artworkId);
          if (exists) return prev.map(r => r.artwork_id === artworkId ? res.reflection : r);
          return [res.reflection, ...prev];
        });
        setSelectedId(res.reflection.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
      setAiAction('');
    }
  };

  const selectedReflection = reflections.find(r => r.id === selectedId) || null;

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="reflections-page">
        <div className="reflections-header">
          <p className="reflections-eyebrow">Reflections</p>
          <div className="ghost-card" style={{ height: 40, width: 260, marginBottom: 'var(--sp-3)' }} />
          <div className="ghost-card ghost-card--short" style={{ width: 180 }} />
        </div>
        <div className="reflections-body">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="ghost-card" style={{ height: 22, width: `${90 - i * 8}%`, marginBottom: 'var(--sp-4)' }} />
          ))}
        </div>
      </div>
    );
  }

  // ── No artworks at all ───────────────────────────────────────
  if (!artworks.length) {
    return (
      <div className="reflections-page">
        <div className="reflections-header">
          <p className="reflections-eyebrow">Reflections</p>
          <h1 className="reflections-title">Your Reflections</h1>
        </div>
        <div className="reflections-empty">
          <div className="reflections-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="reflections-empty-title">No reflections yet</h2>
          <p className="reflections-empty-desc">
            Add an artwork to your collection and a personal reflection will be generated for you.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('add-artwork')}>
            Add artwork
          </button>
        </div>
      </div>
    );
  }

  // ── Artworks exist but none have reflections ─────────────────
  if (!reflections.length) {
    return (
      <div className="reflections-page">
        <div className="reflections-header">
          <p className="reflections-eyebrow">Reflections</p>
          <h1 className="reflections-title">Your Reflections</h1>
          <p className="reflections-date">
            {artworks.length} artwork{artworks.length !== 1 ? 's' : ''} · no reflections yet
          </p>
        </div>
        <div className="reflections-empty">
          <div className="reflections-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="reflections-empty-title">No reflections generated yet</h2>
          <p className="reflections-empty-desc">
            Go to My Artwork and generate a reflection for any of your {artworks.length} work{artworks.length !== 1 ? 's' : ''}.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('my-artwork')}>
            Go to My Artwork
          </button>
        </div>
      </div>
    );
  }

  // ── Main view: sidebar list + reading pane ───────────────────
  return (
    <div className="reflections-page" style={{ maxWidth: 900 }}>
      <div className="reflections-header">
        <p className="reflections-eyebrow">Reflections</p>
        <h1 className="reflections-title">Your Reflections</h1>
        <p className="reflections-date">
          {reflections.length} reflection{reflections.length !== 1 ? 's' : ''} across {artworks.length} artwork{artworks.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: reflections.length > 1 ? '220px 1fr' : '1fr', gap: 'var(--sp-6)', alignItems: 'start' }}>

        {/* Sidebar — only shown when multiple reflections */}
        {reflections.length > 1 && (
          <nav style={{
            background: 'var(--white)',
            border: '1px solid var(--line-soft)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--sp-2)',
            boxShadow: 'var(--shadow-sm)',
            position: 'sticky',
            top: 'calc(var(--header-h) + var(--sp-6))',
          }}>
            {reflections.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 3,
                  width: '100%', padding: 'var(--sp-3) var(--sp-4)',
                  background: selectedId === r.id ? 'var(--paper-3)' : 'none',
                  border: 'none', borderRadius: 'var(--r-xs)',
                  textAlign: 'left', cursor: 'pointer',
                  transition: 'background var(--t-normal) var(--ease)',
                }}
              >
                <span style={{
                  fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
                  color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {r.artwork?.title || 'Untitled'}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
                </span>
              </button>
            ))}
          </nav>
        )}

        {/* Reading pane */}
        <div>
          {selectedReflection ? (
            <>
              {/* Artwork title above the reading pane */}
              <div style={{ marginBottom: 'var(--sp-6)', paddingBottom: 'var(--sp-6)', borderBottom: '1px solid var(--line-soft)' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-2)' }}>
                  On
                </p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-regular)', color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
                  {selectedReflection.artwork?.title || 'Untitled'}
                </h2>
              </div>

              <ReflectionReader
                reflectionData={selectedReflection}
                currentUser={currentUser}
                onRefine={handleRefine}
                onRegenerate={handleRegenerate}
                loadingAI={loadingAI}
                aiAction={aiAction}
              />
            </>
          ) : (
            <p style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Select a reflection to read.</p>
          )}
        </div>
      </div>

      <div className="reflections-back" style={{ marginTop: 'var(--sp-8)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('my-artwork')}>
          ← Back to collection
        </button>
      </div>
    </div>
  );
};

export default Reflections;
