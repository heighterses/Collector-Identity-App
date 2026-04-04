import { useState } from 'react';

const ReflectionPage = ({ onLogout, artwork }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedReflection, setGeneratedReflection] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);

  const handleGenerateReflection = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/reflection', { method: 'POST' });
      const data = await res.json();
      setGeneratedReflection(data.reflection);
    } catch { setError('Failed to generate reflection'); }
    finally { setLoading(false); }
  };

  const handleRefineReflection = async () => {
    if (!userInput.trim()) return;
    setRefineLoading(true); setError('');
    try {
      const res = await fetch('/api/reflection/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artwork_id: artwork?.id, user_input: userInput })
      });
      const data = await res.json();
      if (data.reflection) { setGeneratedReflection(data.reflection); setUserInput(''); }
    } catch { setError('Failed to refine reflection'); }
    finally { setRefineLoading(false); }
  };

  return (
    <div className="reading-page">
      <div className="reading-page-header">
        <p className="reading-eyebrow">Reflection</p>
        <h1 className="reading-title">Generate Reflection</h1>
        <p className="reading-context">Create an interpretation of your artwork</p>
      </div>

      {!generatedReflection ? (
        <div>
          {artwork && (
            <div style={{ marginBottom: 'var(--sp-10)', padding: 'var(--sp-6)', background: 'var(--paper-2)', borderRadius: 'var(--r-xs)', border: '1px solid var(--line-soft)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-4)' }}>Your Artwork</p>
              {artwork.image_url && (
                <img src={`http://localhost:3001${artwork.image_url}`} alt="artwork" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 'var(--r-xs)', marginBottom: 'var(--sp-4)', background: 'var(--ink)' }} />
              )}
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--ink)', margin: '0 0 var(--sp-2) 0', letterSpacing: '-0.02em' }}>{artwork.title}</p>
              {artwork.description && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', margin: 0 }}>{artwork.description}</p>}
            </div>
          )}

          <p style={{ fontSize: 'var(--text-base)', color: 'var(--gray-500)', marginBottom: 'var(--sp-8)', textAlign: 'center', fontStyle: 'italic' }}>
            Generate a thoughtful reflection about your artwork.
          </p>

          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--sp-4)' }}>{error}</div>}

          <button onClick={handleGenerateReflection} disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Generating…</>
              : 'Generate Reflection'}
          </button>
        </div>
      ) : (
        <>
          <div className="reading-body">
            <p className="reading-text">{generatedReflection.content}</p>
          </div>

          <div className="reading-ai-panel">
            <p className="reading-ai-label">
              <span className="reading-ai-pulse" />
              Refine this reflection
            </p>
            <textarea
              className="reading-ai-textarea"
              placeholder="Tell the AI how to improve this reflection…"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={refineLoading}
            />
            {error && <div className="alert alert-error" style={{ marginBottom: 'var(--sp-4)' }}>{error}</div>}
            <div className="reading-ai-actions">
              <button onClick={handleRefineReflection} disabled={refineLoading || !userInput.trim()} className="btn btn-primary">
                {refineLoading
                  ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Refining…</>
                  : 'Refine'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReflectionPage;
