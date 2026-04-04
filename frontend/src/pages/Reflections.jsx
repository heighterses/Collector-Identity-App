import { useState, useEffect } from 'react';
import { reflection } from '../api.js';
import { formatDate } from '../utils/dateUtils.js';

const Reflections = ({ onNavigate, currentUser }) => {
  const [userReflection, setUserReflection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInput, setUserInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAction, setAiAction] = useState('');

  useEffect(() => { loadReflection(); }, []);

  const loadReflection = async () => {
    setLoading(true); setError('');
    try { const d = await reflection.getMine(); setUserReflection(d.reflection); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRefine = async () => {
    if (!userInput.trim()) return;
    setLoadingAI(true); setAiAction('refine');
    try {
      const res = await reflection.refine({ user_input: userInput });
      if (res?.reflection) setUserReflection(res.reflection);
      setUserInput('');
    } catch (err) { console.error(err); }
    finally { setLoadingAI(false); setAiAction(''); }
  };

  const handleRegenerate = async () => {
    setLoadingAI(true); setAiAction('regenerate');
    try {
      const res = await reflection.regenerate();
      if (res?.reflection) setUserReflection(res.reflection);
    } catch (err) { console.error(err); }
    finally { setLoadingAI(false); setAiAction(''); }
  };

  const fmtDate = (d) => formatDate(d, currentUser?.timezone || 'UTC', currentUser?.language || 'en');

  if (loading) {
    return (
      <div className="reading-page">
        <div className="reading-page-header">
          <div style={{ height: 12, width: 100, background: 'var(--paper-3)', borderRadius: 2, marginBottom: 'var(--sp-4)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 44, width: 260, background: 'var(--paper-2)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div className="ghost-cards">
          <div className="ghost-card ghost-card--tall" style={{ height: 300 }} />
          <div className="ghost-card ghost-card--short" style={{ width: '80%' }} />
          <div className="ghost-card ghost-card--short" style={{ width: '65%' }} />
        </div>
      </div>
    );
  }

  if (error || !userReflection) {
    return (
      <div className="reading-page">
        <div className="reading-page-header">
          <p className="reading-eyebrow">Reflections</p>
          <h1 className="reading-title">Your Reflection</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-frame" />
          <h3 className="empty-state-title">{error ? 'Unable to load' : 'No reflection yet'}</h3>
          <p className="empty-state-description">
            {error || 'Add your artwork and a reflection will be generated — a thoughtful reading of your creative identity.'}
          </p>
          {error
            ? <button onClick={loadReflection} className="btn btn-primary">Try again</button>
            : <button onClick={() => onNavigate('add-artwork')} className="btn btn-primary btn-lg">Add artwork</button>
          }
        </div>
      </div>
    );
  }

  return (
    <div className="reading-page">
      {/* Header */}
      <div className="reading-page-header">
        <p className="reading-eyebrow">Reflection</p>
        <h1 className="reading-title">
          {userReflection.artwork?.title || 'Your Artwork'}
        </h1>
        <p className="reading-context">A reading of your work</p>
        <p className="reading-date">{fmtDate(userReflection.created_at)}</p>
      </div>

      {/* The reading */}
      <div className="reading-body">
        <p className="reading-text">{userReflection.content}</p>
      </div>

      {/* AI panel */}
      <div className="reading-ai-panel">
        <p className="reading-ai-label">
          <span className="reading-ai-pulse" />
          Refine this reflection
        </p>
        <textarea
          className="reading-ai-textarea"
          placeholder="Share your thoughts, feelings, or context to guide the next version…"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={loadingAI}
        />
        <div className="reading-ai-actions">
          <button
            onClick={handleRefine}
            disabled={loadingAI || !userInput.trim()}
            className="btn btn-primary"
          >
            {loadingAI && aiAction === 'refine'
              ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Refining…</>
              : 'Refine'}
          </button>
          <button
            onClick={handleRegenerate}
            disabled={loadingAI}
            className="btn btn-secondary"
          >
            {loadingAI && aiAction === 'regenerate'
              ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generating…</>
              : 'Regenerate'}
          </button>
        </div>
      </div>

      <p className="reading-note">This reflection evolves with your input.</p>

      <div className="reading-back">
        <button onClick={() => onNavigate('my-artwork')} className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          ← Back to artwork
        </button>
      </div>
    </div>
  );
};

export default Reflections;
