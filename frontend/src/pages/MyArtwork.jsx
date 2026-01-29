import { useState, useEffect } from 'react';
import { artwork } from '../api.js';

const MyArtwork = ({ onNavigate, onArtworkDeleted }) => {
  const [userArtwork, setUserArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleRemoveArtwork = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setError('');
    
    try {
      await artwork.deleteMine();
      
      // Clear local state
      setUserArtwork(null);
      setShowDeleteConfirm(false);
      
      // Notify parent component about deletion
      if (onArtworkDeleted) {
        onArtworkDeleted();
      }
      
      // Navigate to add artwork page
      if (onNavigate) {
        onNavigate('add-artwork');
      }
    } catch (err) {
      setError(err.message || 'Failed to remove artwork. Please try again.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
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
            {userArtwork.image_url && (
              <div style={styles.imageContainer}>
                <img
                  src={userArtwork.image_url}
                  alt={userArtwork.title}
                  style={styles.artworkImage}
                />
              </div>
            )}

            <div style={styles.artworkDetails}>
              <h2 style={styles.artworkTitle}>{userArtwork.title}</h2>
              <p style={styles.uploadDate}>
                Uploaded {formatDate(userArtwork.created_at)}
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

          {/* Actions Section */}
          <div style={styles.actionsSection}>
            <button 
              onClick={handleRemoveArtwork}
              className="btn btn-danger"
              style={styles.removeButton}
              disabled={deleting}
            >
              {deleting ? 'Removing...' : 'Remove Artwork'}
            </button>
            <p style={styles.removeHint}>
              Remove this artwork to test with a different piece
            </p>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalBackdrop} onClick={cancelDelete}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Remove Artwork</h3>
            </div>
            <div style={styles.modalContent}>
              <p style={styles.modalMessage}>
                Are you sure you want to remove "{userArtwork?.title}"? This will also delete any associated reflections.
              </p>
              <p style={styles.modalWarning}>
                This action cannot be undone.
              </p>
            </div>
            <div style={styles.modalActions}>
              <button 
                onClick={cancelDelete}
                className="btn btn-secondary"
                style={styles.cancelButton}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="btn btn-danger"
                style={styles.confirmButton}
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Remove Artwork'}
              </button>
            </div>
          </div>
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
  actionsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    padding: 'var(--space-6)',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-gray-200)',
  },
  removeButton: {
    alignSelf: 'flex-start',
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
  removeHint: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-gray-500)',
    margin: 0,
    fontStyle: 'italic',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
  },
  modal: {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '400px',
    boxShadow: 'var(--shadow-xl)',
    animation: 'modalSlideIn 0.2s ease-out',
  },
  modalHeader: {
    padding: 'var(--space-6) var(--space-6) var(--space-4) var(--space-6)',
    borderBottom: '1px solid var(--color-gray-200)',
  },
  modalTitle: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-900)',
    margin: 0,
  },
  modalContent: {
    padding: 'var(--space-6)',
  },
  modalMessage: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-700)',
    lineHeight: 'var(--line-height-relaxed)',
    margin: '0 0 var(--space-4) 0',
  },
  modalWarning: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-error)',
    fontWeight: 'var(--font-weight-medium)',
    margin: 0,
  },
  modalActions: {
    display: 'flex',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-6) var(--space-6) var(--space-6)',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
  confirmButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
};

export default MyArtwork;