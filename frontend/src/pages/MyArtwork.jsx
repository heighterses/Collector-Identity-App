import { useState, useEffect } from 'react';
import { artwork } from '../api.js';
import { formatDate } from '../utils/dateUtils.js';

const MyArtwork = ({ onNavigate, onArtworkDeleted, currentUser }) => {
  const [userArtwork, setUserArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reflectionExpanded, setReflectionExpanded] = useState(false);

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

  const formatArtworkDate = (dateString) => {
    return formatDate(
      dateString, 
      currentUser?.timezone || 'UTC', 
      currentUser?.language || 'en'
    );
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
            {/* Show artwork type indicator */}
            <div style={styles.artworkTypeIndicator}>
              <span style={styles.typeLabel}>
                {userArtwork.artwork_type === 'text' ? 'Text-Only Artwork' : 'Image Artwork'}
              </span>
            </div>

            {userArtwork.image_url && userArtwork.artwork_type === 'image' && (
              <div style={styles.imageContainer}>
                <img
                  src={userArtwork.image_url}
                  alt={userArtwork.title}
                  style={styles.artworkImage}
                />
              </div>
            )}

            {userArtwork.artwork_type === 'text' && (
              <div style={styles.textArtworkContainer}>
                <div style={styles.textArtworkIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <p style={styles.textArtworkLabel}>Text-based artwork</p>
              </div>
            )}

            <div style={styles.artworkDetails}>
              <h2 style={styles.artworkTitle}>{userArtwork.title}</h2>
              <p style={styles.uploadDate}>
                Created {formatArtworkDate(userArtwork.created_at)}
              </p>

              {userArtwork.description && (
                <div style={styles.descriptionSection}>
                  <h3 style={styles.descriptionTitle}>
                    {userArtwork.artwork_type === 'text' ? 'Artwork Description' : 'Description'}
                  </h3>
                  <p style={styles.description}>{userArtwork.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reflection Section - Collapsible */}
          <div style={styles.reflectionSection}>
            <div style={styles.reflectionHeader}>
              <div style={styles.reflectionHeaderContent}>
                <h3 style={styles.reflectionTitle}>Reflection</h3>
                {userArtwork.reflection ? (
                  <span style={styles.reflectionStatus}>Generated</span>
                ) : (
                  <span style={styles.reflectionStatusPending}>Generating...</span>
                )}
              </div>
              
              <button
                onClick={() => setReflectionExpanded(!reflectionExpanded)}
                className="btn btn-secondary"
                style={styles.toggleButton}
                disabled={!userArtwork.reflection}
              >
                {reflectionExpanded ? 'Hide Reflection' : 'View Reflection'}
              </button>
            </div>

            {reflectionExpanded && userArtwork.reflection && (
              <div style={styles.reflectionContent}>
                <div style={styles.reflectionText}>
                  {userArtwork.reflection.content}
                </div>
                <div style={styles.reflectionMeta}>
                  <span style={styles.reflectionDate}>
                    Generated {formatArtworkDate(userArtwork.reflection.created_at)}
                  </span>
                  <span style={styles.reflectionType}>
                    {userArtwork.reflection.type === 'initial_interpretation' ? 'Initial Interpretation' : userArtwork.reflection.type}
                  </span>
                </div>
                <div style={styles.reflectionActions}>
                  <button 
                    onClick={handleViewReflection}
                    className="btn btn-secondary"
                    style={styles.viewAllReflectionsButton}
                  >
                    View All Reflections
                  </button>
                </div>
              </div>
            )}

            {!userArtwork.reflection && (
              <div style={styles.reflectionPlaceholder}>
                <div style={styles.loadingIndicator}>
                  <div style={styles.loadingSpinner}></div>
                  <p style={styles.loadingText}>Generating your reflection...</p>
                </div>
                <p style={styles.loadingSubtext}>
                  This usually takes a few moments. Your reflection will appear here once ready.
                </p>
              </div>
            )}
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
  artworkTypeIndicator: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: 'var(--space-2)',
  },
  typeLabel: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-600)',
    backgroundColor: 'var(--color-gray-100)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  textArtworkContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12)',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--radius-lg)',
    border: '2px dashed var(--color-gray-300)',
    gap: 'var(--space-4)',
  },
  textArtworkIcon: {
    color: 'var(--color-gray-400)',
  },
  textArtworkLabel: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-gray-600)',
    margin: 0,
    fontStyle: 'italic',
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
  descriptionTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-800)',
    margin: '0 0 var(--space-3) 0',
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
  reflectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  reflectionHeaderContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  reflectionTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-gray-800)',
    margin: 0,
  },
  reflectionStatus: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-green-700)',
    backgroundColor: 'var(--color-green-100)',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  reflectionStatusPending: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-amber-700)',
    backgroundColor: 'var(--color-amber-100)',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  toggleButton: {
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    whiteSpace: 'nowrap',
  },
  reflectionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--color-gray-200)',
    animation: 'slideDown 0.2s ease-out',
  },
  reflectionText: {
    fontSize: 'var(--font-size-base)',
    lineHeight: 'var(--line-height-relaxed)',
    color: 'var(--color-gray-700)',
    padding: 'var(--space-4)',
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-gray-200)',
    fontStyle: 'italic',
  },
  reflectionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexWrap: 'wrap',
  },
  reflectionDate: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-gray-500)',
  },
  reflectionType: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-gray-600)',
    backgroundColor: 'var(--color-gray-100)',
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 'var(--font-weight-medium)',
  },
  reflectionActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  viewAllReflectionsButton: {
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--font-size-sm)',
  },
  reflectionPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-6)',
    textAlign: 'center',
  },
  loadingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid var(--color-gray-200)',
    borderTop: '2px solid var(--color-accent)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-gray-700)',
    margin: 0,
  },
  loadingSubtext: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-500)',
    margin: 0,
    lineHeight: 'var(--line-height-relaxed)',
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