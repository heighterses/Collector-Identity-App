import { useState, useEffect } from 'react';
import { reflection } from '../api.js';
import { formatDate } from '../utils/dateUtils.js';

// ── Normalise image URL ──────────────────────────────────────────────────────
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

// ── Reading pane ─────────────────────────────────────────────────────────────
const ReflectionReader = ({ reflectionData, currentUser, onRefine, onRegenerate, loadingAI, aiAction }) => {
  const [userInput, setUserInput] = useState('');
  const fmtDate = (d) => formatDate(d, currentUser?.timezone || 'UTC', currentUser?.language || 'en');
  const imgSrc = normaliseImageUrl(reflectionData.artwork?.image_url);

  return (
    <div className="rf-reader">

      {/* 1 — Header */}
      <div className="rf-reader-header">
        <p className="rf-reader-on">On</p>
        <h2 className="rf-reader-title">
          {reflectionData.artwork?.title || 'Untitled'}
        </h2>
      </div>

      {/* 2 — Artwork preview: full image, no cropping */}
      {imgSrc && (
        <div className="rf-artwork-preview">
          <img
            src={imgSrc}
            alt={reflectionData.artwork?.title || 'Artwork'}
            className="rf-artwork-img"
          />
        </div>
      )}

      {/* 3 — Reflection text */}
      <div className="rf-text-block">
        {(() => {
          const content = reflectionData.content || '';
          // Split off first sentence for the lead highlight
          const firstDot = content.search(/[.!?]\s/);
          const lead = firstDot > 0 ? content.slice(0, firstDot + 1) : '';
          const rest = firstDot > 0 ? content.slice(firstDot + 1).trimStart() : content;
          return (
            <>
              {lead && <span className="rf-text-lead">{lead}</span>}
              {rest && <p className="rf-text">{rest}</p>}
            </>
          );
        })()}
        {reflectionData.created_at && (
          <p className="rf-date">{fmtDate(reflectionData.created_at)}</p>
        )}
      </div>

      {/* 4 — AI refine panel */}
      <div className="rf-ai-panel">
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
            {loadingAI && aiAction === 'refine'
              ? <span className="ai-step"><span className="ai-step-dot" />Refining<span className="ai-dots"><span>.</span><span>.</span><span>.</span></span></span>
              : 'Refine'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onRegenerate(reflectionData.artwork_id)}
            disabled={loadingAI}
          >
            {loadingAI && aiAction === 'regenerate'
              ? <span className="ai-step"><span className="ai-step-dot" />Regenerating<span className="ai-dots"><span>.</span><span>.</span><span>.</span></span></span>
              : 'Regenerate'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
const Reflections = ({ onNavigate, currentUser, artworks = [], initialArtworkId = null }) => {
  const [reflections, setReflections]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedId, setSelectedId]     = useState(null);
  const [loadingAI, setLoadingAI]       = useState(false);
  const [aiAction, setAiAction]         = useState('');

  useEffect(() => {
    loadAllReflections();
  }, [artworks.map(a => a.id).join(',')]);

  const loadAllReflections = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        artworks.map(async (art) => {
          try {
            const res = await reflection.getByArtworkId(art.id);
            return res?.reflection || null;
          } catch { return null; }
        })
      );
      const valid = results.filter(Boolean);
      setReflections(valid);

      // If we arrived here from "View Reflection" on a specific artwork,
      // find that artwork's reflection and pre-select it.
      // Otherwise fall back to the first reflection.
      if (valid.length > 0) {
        const targetReflection = initialArtworkId
          ? valid.find(r => r.artwork_id === initialArtworkId)
          : null;
        setSelectedId(targetReflection ? targetReflection.id : valid[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async (reflectionId, userInput) => {
    if (!userInput.trim() || !reflectionId) return;
    setLoadingAI(true); setAiAction('refine');
    try {
      const res = await reflection.refine(reflectionId, userInput);
      if (res?.reflection) {
        setReflections(prev => prev.map(r => r.id === reflectionId ? res.reflection : r));
      }
    } catch (err) { console.error(err); }
    finally { setLoadingAI(false); setAiAction(''); }
  };

  const handleRegenerate = async (artworkId) => {
    setLoadingAI(true); setAiAction('regenerate');
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
    } catch (err) { console.error(err); }
    finally { setLoadingAI(false); setAiAction(''); }
  };

  const selectedReflection = reflections.find(r => r.id === selectedId) || null;

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rf-page">
        <div className="rf-layout">
          <div className="ghost-card" style={{ height: 400, borderRadius: 12 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="ghost-card" style={{ height: 18, width: `${88 - i * 8}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty — no artworks ──────────────────────────────────────
  if (!artworks.length) {
    return (
      <div className="rf-page">
        <div className="pattern-empty">
          <div className="pattern-empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="pattern-empty-title">No reflections yet</h2>
          <p className="pattern-empty-desc">Add an artwork to your collection and a personal reflection will be generated for you.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('add-artwork')}>Add artwork</button>
        </div>
      </div>
    );
  }

  // ── Empty — artworks but no reflections ──────────────────────
  if (!reflections.length) {
    return (
      <div className="rf-page">
        <div className="pattern-empty">
          <div className="pattern-empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="pattern-empty-title">No reflections generated yet</h2>
          <p className="pattern-empty-desc">Go to My Artwork and generate a reflection for any of your {artworks.length} work{artworks.length !== 1 ? 's' : ''}.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('my-artwork')}>Go to My Artwork</button>
        </div>
      </div>
    );
  }

  // ── Main: sidebar + reading pane ─────────────────────────────
  return (
    <div className="rf-page">

      <p className="rf-count-line">
        {reflections.length} reflection{reflections.length !== 1 ? 's' : ''} across {artworks.length} artwork{artworks.length !== 1 ? 's' : ''}
      </p>

      {/* Two-column layout */}
      <div className={`rf-layout ${reflections.length === 1 ? 'rf-layout--single' : ''}`}>

        {/* LEFT — Artwork selector */}
        {reflections.length > 1 && (
          <nav className="rf-sidebar">
            <p className="rf-sidebar-label">Artworks</p>
            {reflections.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`rf-sidebar-item ${selectedId === r.id ? 'rf-sidebar-item--active' : ''}`}
              >
                <span className="rf-sidebar-item-title">
                  {r.artwork?.title || 'Untitled'}
                </span>
                <span className="rf-sidebar-item-date">
                  {r.created_at
                    ? new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                    : ''}
                </span>
              </button>
            ))}
          </nav>
        )}

        {/* RIGHT — Reading pane */}
        <div className="rf-reading-col">
          {selectedReflection ? (
            <ReflectionReader
              reflectionData={selectedReflection}
              currentUser={currentUser}
              onRefine={handleRefine}
              onRegenerate={handleRegenerate}
              loadingAI={loadingAI}
              aiAction={aiAction}
            />
          ) : (
            <p className="rf-empty-hint">Select a reflection to read.</p>
          )}
        </div>

      </div>

      <div className="rf-back">
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('my-artwork')}>
          ← Back to collection
        </button>
      </div>
    </div>
  );
};

export default Reflections;
