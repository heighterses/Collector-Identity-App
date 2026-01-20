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
        <div style={styles.loadingState} className="pinterest-card floating">
          <div className="spinner"></div>
          <p style={styles.loadingText}>Loading your masterpiece...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title} className="gradient-text">🎨 My Artwork</h1>
        </div>
        <div style={styles.errorState} className="pinterest-card">
          <div style={styles.errorIcon} className="floating">⚠️</div>
          <p style={styles.errorText}>Error loading artwork: {error}</p>
          <button onClick={loadArtwork} style={styles.retryButton} className="btn-primary icon-hover">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title} className="gradient-text">🎨 My Artwork</h1>
        <p style={styles.subtitle}>Your creative expression</p>
      </div>

      {userArtwork ? (
        <div style={styles.artworkContainer}>
          <div style={styles.artworkCard} className="pinterest-card">
            <div style={styles.artworkHeader}>
              <h2 style={styles.artworkTitle}>{userArtwork.title}</h2>
              <div style={styles.artworkMeta}>
                <span style={styles.createdDate} className="icon-hover">
                  📅 Created {new Date(userArtwork.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {userArtwork.imageUrl && (
              <div style={styles.imageContainer} className="image-hover">
                <img
                  src={userArtwork.imageUrl}
                  alt={userArtwork.title}
                  style={styles.artworkImage}
                />
                <div style={styles.imageOverlay}>
                  <span style={styles.overlayIcon} className="icon-hover floating">✨</span>
                </div>
              </div>
            )}

            {userArtwork.description && (
              <div style={styles.descriptionContainer} className="glass-card">
                <h3 style={styles.descriptionTitle}>
                  <span className="icon-hover">📝</span> Description
                </h3>
                <p style={styles.description}>{userArtwork.description}</p>
              </div>
            )}

            <div style={styles.artworkFooter}>
              <div style={styles.artworkStats}>
                <div style={styles.stat} className="icon-hover">
                  <span style={styles.statIcon}>🎭</span>
                  <div>
                    <span style={styles.statLabel}>Type</span>
                    <span style={styles.statValue}>
                      {userArtwork.imageUrl && userArtwork.description ? 'Image + Text' :
                       userArtwork.imageUrl ? 'Image' : 'Text'}
                    </span>
                  </div>
                </div>
                <div style={styles.stat} className="icon-hover">
                  <span style={styles.statIcon}>✅</span>
                  <div>
                    <span style={styles.statLabel}>Status</span>
                    <span style={styles.statValue}>Complete</span>
                  </div>
                </div>
                <div style={styles.stat} className="icon-hover">
                  <span style={styles.statIcon}>🌟</span>
                  <div>
                    <span style={styles.statLabel}>Quality</span>
                    <span style={styles.statValue}>Masterpiece</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.emptyState} className="pinterest-card">
          <div style={styles.emptyStateIcon} className="floating">🎨</div>
          <h2 style={styles.emptyStateTitle}>No artwork yet</h2>
          <p style={styles.emptyStateText}>
            You haven't created any artwork yet. Your creative journey begins with your first piece.
          </p>
          <div style={styles.emptyStateNote} className="glass-card">
            <span style={styles.noteIcon} className="icon-hover floating">💡</span>
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
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '40px',
    textAlign: 'center',
  },
  title: {
    fontSize: '42px',
    fontWeight: '800',
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em',
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  },
  subtitle: {
    fontSize: '18px',
    color: 'rgba(90, 90, 90, 0.9)',
    margin: 0,
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    fontWeight: '500',
  },
  artworkContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  artworkCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '30px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(20px)',
  },
  artworkHeader: {
    marginBottom: '30px',
  },
  artworkTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1a1a1a',
    margin: '0 0 16px 0',
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #EFEBCE 0%, #E5E0B8 50%, #DBD5A2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  artworkMeta: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  createdDate: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '600',
    padding: '8px 16px',
    background: 'rgba(239, 235, 206, 0.1)',
    borderRadius: '20px',
    border: '1px solid rgba(239, 235, 206, 0.2)',
  },
  imageContainer: {
    marginBottom: '30px',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  artworkImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '600px',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  imageOverlay: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  overlayIcon: {
    fontSize: '20px',
  },
  descriptionContainer: {
    marginBottom: '30px',
    padding: '30px',
    background: 'linear-gradient(135deg, rgba(239, 235, 206, 0.1), rgba(229, 224, 184, 0.1))',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  descriptionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  description: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#374151',
    margin: 0,
    fontWeight: '500',
  },
  artworkFooter: {
    borderTop: '2px solid rgba(0, 0, 0, 0.05)',
    paddingTop: '30px',
  },
  artworkStats: {
    display: 'flex',
    gap: '40px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '18px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
  },
  statIcon: {
    fontSize: '24px',
    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: '700',
    marginBottom: '4px',
  },
  statValue: {
    display: 'block',
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: '700',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 40px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '30px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  emptyStateIcon: {
    fontSize: '80px',
    marginBottom: '30px',
    display: 'block',
    filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.1))',
  },
  emptyStateTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1a1a1a',
    margin: '0 0 20px 0',
    background: 'linear-gradient(135deg, #EFEBCE 0%, #E5E0B8 50%, #DBD5A2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  emptyStateText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.7',
    margin: '0 0 30px 0',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontWeight: '500',
  },
  emptyStateNote: {
    padding: '25px',
    background: 'linear-gradient(135deg, rgba(239, 235, 206, 0.1), rgba(229, 224, 184, 0.1))',
    borderRadius: '20px',
    border: '1px solid rgba(239, 235, 206, 0.2)',
    maxWidth: '600px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  noteIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  noteText: {
    fontSize: '14px',
    color: '#A69B7B',
    margin: 0,
    fontWeight: '600',
    textAlign: 'left',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '30px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
    marginTop: '20px',
    fontWeight: '500',
  },
  errorState: {
    textAlign: 'center',
    padding: '80px 40px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '30px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  errorIcon: {
    fontSize: '60px',
    marginBottom: '20px',
    display: 'block',
  },
  errorText: {
    fontSize: '16px',
    color: '#dc2626',
    margin: '0 0 20px 0',
    fontWeight: '600',
  },
  retryButton: {
    padding: '14px 28px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
  },
};

// Add hover effect for image overlay
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .image-hover:hover .imageOverlay {
    opacity: 1;
  }
`;
document.head.appendChild(styleSheet);

export default MyArtwork;