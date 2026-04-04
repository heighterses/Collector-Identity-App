import { useState } from 'react';

const ReflectionPage = ({ onLogout, artwork }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedReflection, setGeneratedReflection] = useState(null);

  // NEW STATES
  const [userInput, setUserInput] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);

  // =========================
  // GENERATE INITIAL REFLECTION
  // =========================
  const handleGenerateReflection = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reflection', {
        method: 'POST'
      });

      const data = await res.json();
      setGeneratedReflection(data.reflection);

    } catch (err) {
      setError('Failed to generate reflection');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // REFINE REFLECTION (NEW)
  // =========================
  const handleRefineReflection = async () => {
    if (!userInput.trim()) return;

    setRefineLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reflection/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artwork_id: artwork.id,
          user_input: userInput
        })
      });

      const data = await res.json();

      if (data.reflection) {
        setGeneratedReflection(data.reflection);
        setUserInput('');
      }

    } catch (err) {
      setError('Failed to refine reflection');
    } finally {
      setRefineLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Generate Reflection</h1>
        <p className="dashboard-subtitle">Create insights about your artwork</p>
      </div>

      {!generatedReflection ? (
        <div className="card">
          <div className="card-content">

            {artwork && (
              <div style={styles.artworkPreview}>
                <h3 style={styles.previewTitle}>Your Artwork</h3>

                {/* IMAGE FIX */}
                {artwork.image_url && (
                  <img
                    src={`http://localhost:3001${artwork.image_url}`}
                    alt="artwork"
                    style={{ width: '300px', marginBottom: '10px' }}
                  />
                )}

                <div style={styles.artworkInfo}>
                  <span style={styles.artworkTitle}>{artwork.title}</span>
                  {artwork.description && (
                    <p style={styles.artworkDescription}>{artwork.description}</p>
                  )}
                </div>
              </div>
            )}

            <div style={styles.generateSection}>
              <p style={styles.generateDescription}>
                Generate a thoughtful reflection about your artwork.
              </p>

              {error && <div style={styles.error}>{error}</div>}

              <button
                onClick={handleGenerateReflection}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Generating...' : 'Generate Reflection'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Your Reflection</h2>
          </div>

          <div className="card-content">
            <div style={styles.reflectionContent}>
              <p style={styles.reflectionText}>
                {generatedReflection.content}
              </p>
            </div>

            {/* =========================
                NEW: USER INPUT BOX
            ========================= */}
            <textarea
              placeholder="Tell AI how to improve this reflection..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              style={styles.textarea}
            />

            {/* =========================
                NEW: REFINE BUTTON
            ========================= */}
            <button
              onClick={handleRefineReflection}
              disabled={refineLoading}
              className="btn btn-secondary"
              style={{ marginTop: '10px' }}
            >
              {refineLoading ? 'Refining...' : 'Refine Reflection'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  artworkPreview: {
    padding: '20px',
    background: '#f9fafb',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  previewTitle: {
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  artworkInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  artworkTitle: {
    fontWeight: 'bold'
  },
  artworkDescription: {
    color: '#666'
  },
  generateSection: {
    textAlign: 'center'
  },
  generateDescription: {
    marginBottom: '20px'
  },
  error: {
    color: 'red',
    marginBottom: '10px'
  },
  reflectionContent: {
    marginBottom: '20px'
  },
  reflectionText: {
    fontStyle: 'italic'
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    marginTop: '15px'
  }
};

export default ReflectionPage;