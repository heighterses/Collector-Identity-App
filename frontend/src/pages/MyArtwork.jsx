import { useState, useEffect } from 'react';
import { artwork } from '../api.js';

const MyArtwork = ({ onNavigate }) => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAddArtwork = () => {
    if (onNavigate) {
      onNavigate('add-artwork');
    }
  };

  const handleViewReflection = () => {
    if (onNavigate) {
      onNavigate('reflections');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Artwork</h1>
        </div>
        <div className="empty-state">
          <h3 className="empty-state-title">Unable to load artwork</h3>
          <p className="empty-state-description">{error}</p>
          <button onClick={loadArtwork} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Artwork</h1>
        <p className="dashboard-subtitle">Your creative record</p>
      </div>

      {userArtwork ? (
        <div style={styles.artworkContainer}>
          {/* Main Artwork Display */}
          <div style={styles.artworkDisplay}>
            {userArtwork.imageUrl && (
              <div style={styles.imageContainer}>
                <img
                  src={userArtwork.imageUrl}
                  alt={userArtwork.title}
                  style={styles.artworkImage}
                />
              </div>
            )}

            <div style={styles.artworkDetails}>
              <h2 style={styles.artworkTitle}>{userArtwork.title}</h2>
              <p style={styles.uploadDate}>
                Uploaded {formatDate(userArtwork.createdAt)}
              </p>

              {userArtwork.description && (
                <div style={styles.descriptionSection}>
                  <p style={styles.description}>{userArtwork.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reflection Section */}
          <div style={styles.reflectionSection}>
            <div style={styles.reflectionStatus}>
              <span style={styles.reflectionLabel}>Reflection</span>
              <span style={styles.reflectionValue}>Generated</span>
            </div>
            
            <button 
              onClick={handleViewReflection}
              className="btn btn-primary"
              style={styles.viewReflectionButton}
            >
              View Reflection
            </button>
          </div>

          {/* Future Hint */}
          <div style={styles.futureHint}>
            <p style={styles.futureText}>Your creative archive will grow here over time.</p>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3 className="empty-state-title">No artwork yet</h3>
          <p className="empty-state-description">
            You haven't submitted any artwork. Start by adding your first piece.
          </p>
          <button 
            onClick={handleAddArtwork}
            className="btn btn-primary"
          >
            Add Artwork
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  artworkContainer: {
    maxWidth: '700px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-12)',
  },
  artworkDisplay: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  imageContainer: {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--color-gray-200)',
    backgroundColor: 'var(--color-white)',
    boxShadow: 'var(--shadow-sm)',
  },
  artworkImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
    maxHeight: '600px',
    objectFit: 'contain',
  },
  artworkDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  artworkTitle: {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-900)',
    margin: 0,
    lineHeight: 'var(--line-height-tight)',
  },
  uploadDate: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-500)',
    margin: 0,
  },
  descriptionSection: {
    marginTop: 'var(--space-4)',
  },
  description: {
    fontSize: 'var(--font-size-base)',
    lineHeight: 'var(--line-height-relaxed)',
    color: 'var(--color-gray-700)',
    margin: 0,
  },
  reflectionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    padding: 'var(--space-6)',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-gray-200)',
  },
  reflectionStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reflectionLabel: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-700)',
  },
  reflectionValue: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-600)',
    padding: 'var(--space-1) var(--space-3)',
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-gray-200)',
  },
  viewReflectionButton: {
    alignSelf: 'flex-start',
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
  futureHint: {
    textAlign: 'center',
    paddingTop: 'var(--space-8)',
    borderTop: '1px solid var(--color-gray-200)',
  },
  futureText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-400)',
    margin: 0,
    fontStyle: 'italic',
  },
};

export default MyArtwork;