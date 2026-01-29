import { useState } from 'react';
import { reflection } from '../api.js';

const ReflectionPage = ({ onLogout, artwork }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedReflection, setGeneratedReflection] = useState(null);

  const handleGenerateReflection = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Starting reflection generation...');
      const result = await reflection.create();
      console.log('Reflection generation successful:', result);
      setGeneratedReflection(result.reflection);
    } catch (err) {
      console.error('Reflection generation error:', err);
      
      // Provide more specific error messages
      let errorMessage = err.message || 'Failed to generate reflection. Please try again.';
      
      if (err.message.includes('Session expired') || err.message.includes('Access token required')) {
        errorMessage = 'Your session has expired. Please refresh the page and log in again.';
      } else if (err.message.includes('No artwork found')) {
        errorMessage = 'Please add an artwork first before generating a reflection.';
      } else if (err.message.includes('Reflection already exists')) {
        errorMessage = 'A reflection already exists for your artwork. Only one reflection is allowed.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
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
                Generate a thoughtful reflection about your artwork to discover deeper meaning and insights.
              </p>

              {error && (
                <div style={styles.error}>
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerateReflection}
                disabled={loading}
                className={`btn btn-primary ${loading ? 'opacity-50' : ''}`}
                style={styles.generateButton}
              >
                {loading ? 'Generating Reflection...' : 'Generate Reflection'}
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
              <p style={styles.reflectionText}>{generatedReflection.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  artworkPreview: {
    padding: 'var(--space-6)',
    background: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-gray-200)',
    marginBottom: 'var(--space-8)',
  },
  previewTitle: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-900)',
    marginBottom: 'var(--space-3)',
  },
  artworkInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  artworkTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-800)',
  },
  artworkDescription: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-600)',
    margin: 0,
    lineHeight: 'var(--line-height-normal)',
  },
  generateSection: {
    textAlign: 'center',
  },
  generateDescription: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-600)',
    lineHeight: 'var(--line-height-relaxed)',
    marginBottom: 'var(--space-8)',
    maxWidth: '500px',
    margin: '0 auto var(--space-8) auto',
  },
  error: {
    color: 'var(--color-error)',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'center',
    padding: 'var(--space-4)',
    background: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(220, 38, 38, 0.2)',
    marginBottom: 'var(--space-6)',
  },
  generateButton: {
    padding: 'var(--space-4) var(--space-8)',
    fontSize: 'var(--font-size-base)',
  },
  reflectionContent: {
    textAlign: 'left',
  },
  reflectionText: {
    fontSize: 'var(--font-size-lg)',
    lineHeight: 'var(--line-height-relaxed)',
    color: 'var(--color-gray-800)',
    margin: 0,
    fontStyle: 'italic',
  },
};

export default ReflectionPage;