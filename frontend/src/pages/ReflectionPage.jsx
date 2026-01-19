import { useState, useEffect } from 'react';
import { reflection, auth } from '../api.js';

const ReflectionPage = ({ onLogout, artwork }) => {
  const [reflectionData, setReflectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReflection();
  }, []);

  const loadReflection = async () => {
    try {
      const data = await reflection.getMine();
      setReflectionData(data.reflection);
    } catch (err) {
      if (err.message.includes('No reflection found')) {
        // User has artwork but no reflection yet
        setReflectionData(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateReflection = async () => {
    setGenerating(true);
    setError('');

    try {
      const data = await reflection.create();
      setReflectionData(data.reflection);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    onLogout();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading your reflection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <div style={styles.error}>{error}</div>
          <button onClick={loadReflection} style={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.appTitle}>Collector Identity</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Sign Out
        </button>
      </div>

      <div style={styles.content}>
        {reflectionData ? (
          <div style={styles.reflectionCard}>
            {/* IMMUTABLE ARTWORK DISPLAY - SINGLE SOURCE OF TRUTH */}
            <div style={styles.artworkSection}>
              <div style={styles.artworkHeader}>
                <h2 style={styles.artworkTitle}>
                  {reflectionData.artwork.title}
                </h2>
                <div style={styles.immutableBadge}>
                  <span style={styles.badgeText}>Your Artwork</span>
                </div>
              </div>
              
              {reflectionData.artwork.imageUrl && (
                <div style={styles.imageContainer}>
                  <img
                    src={reflectionData.artwork.imageUrl}
                    alt={reflectionData.artwork.title}
                    style={styles.artworkImage}
                  />
                </div>
              )}
              
              {reflectionData.artwork.description && (
                <div style={styles.descriptionContainer}>
                  <p style={styles.description}>{reflectionData.artwork.description}</p>
                </div>
              )}
            </div>

            {/* IMMUTABLE REFLECTION DISPLAY */}
            <div style={styles.reflectionSection}>
              <div style={styles.reflectionHeader}>
                <h3 style={styles.reflectionTitle}>Initial Interpretation</h3>
                <span style={styles.reflectionDate}>
                  {new Date(reflectionData.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div style={styles.reflectionContent}>
                <p style={styles.reflectionText}>{reflectionData.content}</p>
              </div>
              
              <div style={styles.reflectionNote}>
                <p style={styles.noteText}>
                  This interpretation is based on your submitted artwork and represents your creative identity at this moment. It is part of your permanent creative record.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.generateCard}>
            {/* DISPLAY ARTWORK FROM BACKEND - NO FORM CONTROLS */}
            <div style={styles.artworkPreview}>
              <div style={styles.previewHeader}>
                <h2 style={styles.previewTitle}>{artwork?.title || 'Your Artwork'}</h2>
                <div style={styles.immutableBadge}>
                  <span style={styles.badgeText}>Submitted</span>
                </div>
              </div>
              
              {artwork?.imageUrl && (
                <div style={styles.previewImageContainer}>
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    style={styles.previewImage}
                  />
                </div>
              )}
              
              {artwork?.description && (
                <div style={styles.previewDescription}>
                  <p>{artwork.description}</p>
                </div>
              )}
            </div>

            <div style={styles.generateSection}>
              <h3 style={styles.generateTitle}>Ready for Your Reflection?</h3>
              <p style={styles.generateSubtitle}>
                Generate your initial interpretation based on the artwork above. This will become part of your permanent creative identity.
              </p>
              
              {error && <div style={styles.error}>{error}</div>}
              
              <button
                onClick={generateReflection}
                disabled={generating}
                style={{
                  ...styles.generateButton,
                  ...(generating ? styles.generateButtonDisabled : {})
                }}
              >
                {generating ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Generating Reflection...
                  </>
                ) : (
                  'Generate Reflection'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#fafafa',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 48px',
    background: 'white',
    borderBottom: '1px solid #e8e8e8',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  appTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: '-0.02em',
  },
  logoutButton: {
    background: 'none',
    border: '1px solid #e8e8e8',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.2s ease',
  },
  content: {
    padding: '48px',
    display: 'flex',
    justifyContent: 'center',
  },
  loadingCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    maxWidth: '400px',
  },
  errorCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    maxWidth: '500px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #1a1a1a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
    display: 'inline-block',
  },
  loadingText: {
    color: '#666',
    fontSize: '16px',
  },
  reflectionCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '800px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
  artworkSection: {
    marginBottom: '48px',
    paddingBottom: '40px',
    borderBottom: '2px solid #f5f5f5',
  },
  artworkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  artworkTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  immutableBadge: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '20px',
    padding: '6px 16px',
  },
  badgeText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  imageContainer: {
    marginBottom: '24px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  artworkImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '500px',
    objectFit: 'cover',
  },
  descriptionContainer: {
    background: '#f8f9fa',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e8e8e8',
  },
  description: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#374151',
    margin: 0,
  },
  reflectionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  reflectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  reflectionTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: '-0.01em',
  },
  reflectionDate: {
    fontSize: '14px',
    color: '#9ca3af',
    fontWeight: '500',
  },
  reflectionContent: {
    background: '#f8f9fa',
    padding: '32px',
    borderRadius: '12px',
    borderLeft: '4px solid #1a1a1a',
    position: 'relative',
  },
  reflectionText: {
    fontSize: '17px',
    lineHeight: '1.8',
    color: '#374151',
    margin: 0,
  },
  reflectionNote: {
    padding: '20px',
    background: '#fffbeb',
    borderRadius: '12px',
    border: '1px solid #fde68a',
  },
  noteText: {
    fontSize: '14px',
    color: '#92400e',
    margin: 0,
    lineHeight: '1.6',
  },
  generateCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '700px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
  artworkPreview: {
    marginBottom: '40px',
    paddingBottom: '32px',
    borderBottom: '2px solid #f5f5f5',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  previewTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  previewImageContainer: {
    marginBottom: '20px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  previewImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '300px',
    objectFit: 'cover',
  },
  previewDescription: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e8e8e8',
  },
  generateSection: {
    textAlign: 'center',
  },
  generateTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  },
  generateSubtitle: {
    fontSize: '17px',
    color: '#666',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  generateButton: {
    padding: '18px 32px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '200px',
  },
  generateButtonDisabled: {
    background: '#d1d5db',
    cursor: 'not-allowed',
  },
  retryButton: {
    padding: '14px 24px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px',
  },
  error: {
    color: '#dc2626',
    fontSize: '15px',
    textAlign: 'center',
    padding: '16px 20px',
    background: '#fef2f2',
    borderRadius: '12px',
    border: '1px solid #fecaca',
    fontWeight: '500',
    marginBottom: '20px',
  },
};

export default ReflectionPage;