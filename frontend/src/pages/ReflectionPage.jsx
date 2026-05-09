import { useState, useEffect } from 'react';

const ReflectionPage = ({ onLogout, artwork }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedReflection, setGeneratedReflection] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);

  // ✅ LOAD EXISTING REFLECTION (IMPORTANT FIX)
  useEffect(() => {
    if (!artwork?.id) return;

    const loadReflection = async () => {
      try {
        const res = await fetch(`/api/reflection/artwork/${artwork.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.reflection) {
          setGeneratedReflection(data.reflection);
        }
      } catch {
        // silently ignore (no reflection yet)
      }
    };

    loadReflection();
  }, [artwork]);

  // ✅ GENERATE (FIXED ENDPOINT)
  const handleGenerateReflection = async () => {
    if (!artwork?.id) {
      setError('No artwork selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/reflection/generate/${artwork.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed');

      setGeneratedReflection(data.reflection);
    } catch (err) {
      setError(err.message || 'Failed to generate reflection');
    } finally {
      setLoading(false);
    }
  };

  // ✅ REFINE (FIXED PAYLOAD)
  const handleRefineReflection = async () => {
    if (!userInput.trim() || !generatedReflection?.id) return;

    setRefineLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reflection/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          reflection_id: generatedReflection.id, // ✅ FIXED
          input: userInput // ✅ FIXED
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed');

      if (data.reflection) {
        setGeneratedReflection(data.reflection);
        setUserInput('');
      }
    } catch (err) {
      setError(err.message || 'Failed to refine reflection');
    } finally {
      setRefineLoading(false);
    }
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
                <img src={artwork.image_url} alt="artwork" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 'var(--r-xs)', marginBottom: 'var(--sp-4)', background: 'var(--ink)' }} />
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
            {loading ? (
              <span className="ai-step">
                <span className="ai-step-dot" />
                Reading your artwork<span className="ai-dots"><span>.</span><span>.</span><span>.</span></span>
              </span>
            ) : 'Generate Reflection'}
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
                  ? <span className="ai-step"><span className="ai-step-dot" />Refining<span className="ai-dots"><span>.</span><span>.</span><span>.</span></span></span>
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