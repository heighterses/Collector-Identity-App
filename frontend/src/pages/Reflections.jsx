import { useState, useEffect } from 'react';
import { reflection, artwork } from '../api.js';

const Reflections = () => {
  const [userReflection, setUserReflection] = useState(null);
  const [userArtwork, setUserArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReflectionData();
  }, []);

  const loadReflectionData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // First check if user has artwork
      try {
        const artworkData = await artwork.getMine();
        setUserArtwork(artworkData.artwork);
        
        // If artwork exists, try to load reflection
        try {
          const reflectionData = await reflection.getMine();
          setUserReflection(reflectionData.reflection);
        } catch (reflectionErr) {
          if (reflectionErr.message.includes('No reflection found')) {
            setUserReflection(null);
          } else {
            setError(reflectionErr.message);
          }
        }
      } catch (artworkErr) {
        if (artworkErr.message.includes('No artwork found')) {
          setUserArtwork(null);
          setUserReflection(null);
        } else {
          setError(artworkErr.message);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Loading your reflections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Reflections</h1>
        </div>
        <div style={styles.errorState}>
          <p style={styles.errorText}>Error loading reflections: {error}</p>
          <button onClick={loadReflectionData} style={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Reflections</h1>
        <p style={styles.subtitle}>Insights into your creative identity</p>
      </div>

      {userReflection ? (
        <div style={styles.reflectionContainer}>
          <div style={styles.reflectionCard}>
            <div style={styles.reflectionHeader}>
              <div style={styles.reflectionMeta}>
                <span style={styles.reflectionType}>
                  {userReflection.type.replace('_', ' ').toUpperCase()}
                </span>
                <span style={styles.reflectionDate}>
                  Generated {new Date(userReflection.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div style={styles.reflectionContent}>
              <p style={styles.reflectionText}>{userReflection.content}</p>
            </div>

            <div style={styles.reflectionNote}>
              <p style={styles.noteText}>
                This interpretation is based on your submitted artwork and represents your creative identity at this moment. 
                It is part of your permanent creative record.
              </p>
            </div>

            {/* Show associated artwork */}
            {userReflection.artwork && (
              <div style={styles.associatedArtwork}>
                <h3 style={styles.associatedTitle}>Based on your artwork</h3>
                <div style={styles.artworkPreview}>
                  <h4 style={styles.artworkTitle}>{userReflection.artwork.title}</h4>
                  
                  {userReflection.artwork.imageUrl && (
                    <div style={styles.artworkImageContainer}>
                      <img
                        src={userReflection.artwork.imageUrl}
                        alt={userReflection.artwork.title}
                        style={styles.artworkImage}
                      />
                    </div>
                  )}
                  
                  {userReflection.artwork.description && (
                    <p style={styles.artworkDescription}>
                      {userReflection.artwork.description.length > 200 
                        ? `${userReflection.artwork.description.substring(0, 200)}...`
                        : userReflection.artwork.description
                      }
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : userArtwork ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>💭</div>
          <h2 style={styles.emptyStateTitle}>No reflection yet</h2>
          <p style={styles.emptyStateText}>
            You have created artwork but haven't generated a reflection yet. 
            A reflection provides insights into your creative identity based on your artwork.
          </p>
          <div style={styles.emptyStateNote}>
            <p style={styles.noteText}>
              Visit your artwork to generate your initial interpretation.
            </p>
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>💭</div>
          <h2 style={styles.emptyStateTitle}>No reflections</h2>
          <p style={styles.emptyStateText}>
            Reflections are generated based on your artwork. Create your first artwork to begin receiving insights into your creative identity.
          </p>
          <div style={styles.emptyStateNote}>
            <p style={styles.noteText}>
              Create artwork first, then generate reflections to understand your creative expression.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  reflectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  reflectionCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f0f0f0',
  },
  reflectionHeader: {
    marginBottom: '24px',
  },
  reflectionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  reflectionType: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '600',
    letterSpacing: '0.05em',
    padding: '4px 12px',
    background: '#f0f9ff',
    borderRadius: '20px',
    border: '1px solid #bae6fd',
  },
  reflectionDate: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  reflectionContent: {
    marginBottom: '24px',
    padding: '32px',
    background: '#f8f9fa',
    borderRadius: '12px',
    borderLeft: '4px solid #1a1a1a',
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
    marginBottom: '24px',
  },
  noteText: {
    fontSize: '14px',
    color: '#92400e',
    margin: 0,
    lineHeight: '1.6',
  },
  associatedArtwork: {
    borderTop: '1px solid #f0f0f0',
    paddingTop: '24px',
  },
  associatedTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 16px 0',
  },
  artworkPreview: {
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e8e8e8',
  },
  artworkTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 16px 0',
  },
  artworkImageContainer: {
    marginBottom: '16px',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  artworkImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '200px',
    objectFit: 'cover',
  },
  artworkDescription: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '64px 32px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  emptyStateIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  emptyStateTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 16px 0',
  },
  emptyStateText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  emptyStateNote: {
    padding: '16px',
    background: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bae6fd',
    maxWidth: '500px',
    margin: '0 auto',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    textAlign: 'center',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #1a1a1a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  errorState: {
    textAlign: 'center',
    padding: '64px 32px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  errorText: {
    fontSize: '16px',
    color: '#dc2626',
    margin: '0 0 16px 0',
  },
  retryButton: {
    padding: '12px 24px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default Reflections;