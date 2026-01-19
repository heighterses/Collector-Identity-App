import { useState, useEffect } from 'react';
import { artwork } from '../api.js';

const MyArtwork = () => {
  const [userArtwork, setUserArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadArtwork();
  }, []);

  const loadArtwork = async () => {
    setLoading(true);
    setError('');
    
    try {
      const artworkData = await artwork.getMine();
      setUserArtwork(artworkData.artwork);
    } catch (err) {
      if (err.message.includes('No artwork found')) {
        setUserArtwork(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Loading your artwork...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Artwork</h1>
        </div>
        <div style={styles.errorState}>
          <p style={styles.errorText}>Error loading artwork: {error}</p>
          <button onClick={loadArtwork} style={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Artwork</h1>
        <p style={styles.subtitle}>Your creative expression</p>
      </div>

      {userArtwork ? (
        <div style={styles.artworkContainer}>
          <div style={styles.artworkCard}>
            <div style={styles.artworkHeader}>
              <h2 style={styles.artworkTitle}>{userArtwork.title}</h2>
              <div style={styles.artworkMeta}>
                <span style={styles.createdDate}>
                  Created {new Date(userArtwork.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {userArtwork.imageUrl && (
              <div style={styles.imageContainer}>
                <img
                  src={userArtwork.imageUrl}
                  alt={userArtwork.title}
                  style={styles.artworkImage}
                />
              </div>
            )}

            {userArtwork.description && (
              <div style={styles.descriptionContainer}>
                <h3 style={styles.descriptionTitle}>Description</h3>
                <p style={styles.description}>{userArtwork.description}</p>
              </div>
            )}

            <div style={styles.artworkFooter}>
              <div style={styles.artworkStats}>
                <div style={styles.stat}>
                  <span style={styles.statLabel}>Type</span>
                  <span style={styles.statValue}>
                    {userArtwork.imageUrl && userArtwork.description ? 'Image + Text' :
                     userArtwork.imageUrl ? 'Image' : 'Text'}
                  </span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statLabel}>Status</span>
                  <span style={styles.statValue}>Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>🎨</div>
          <h2 style={styles.emptyStateTitle}>No artwork yet</h2>
          <p style={styles.emptyStateText}>
            You haven't created any artwork yet. Your creative journey begins with your first piece.
          </p>
          <div style={styles.emptyStateNote}>
            <p style={styles.noteText}>
              In Milestone 1, you can create one artwork that represents your creative identity.
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
  artworkContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  artworkCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f0f0f0',
  },
  artworkHeader: {
    marginBottom: '24px',
  },
  artworkTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em',
  },
  artworkMeta: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  createdDate: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
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
    marginBottom: '24px',
    padding: '24px',
    background: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e8e8e8',
  },
  descriptionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 12px 0',
  },
  description: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#374151',
    margin: 0,
  },
  artworkFooter: {
    borderTop: '1px solid #f0f0f0',
    paddingTop: '24px',
  },
  artworkStats: {
    display: 'flex',
    gap: '32px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: '600',
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
    maxWidth: '400px',
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
  noteText: {
    fontSize: '14px',
    color: '#0369a1',
    margin: 0,
    fontWeight: '500',
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

export default MyArtwork;