import { useState, useEffect } from 'react';
import { reflection } from '../api.js';

const Reflections = ({ onNavigate }) => {
  const [userReflection, setUserReflection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReflection();
  }, []);

  const loadReflection = async () => {
    setLoading(true);
    setError('');
    
    try {
      const reflectionData = await reflection.getMine();
      setUserReflection(reflectionData.reflection);
    } catch (err) {
      if (err.message.includes('No reflection found')) {
        setUserReflection(null);
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

  const handleBackToArtwork = () => {
    if (onNavigate) {
      onNavigate('my-artwork');
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
          <h1 className="dashboard-title">Reflections</h1>
        </div>
        <div className="empty-state">
          <h3 className="empty-state-title">Unable to load reflections</h3>
          <p className="empty-state-description">{error}</p>
          <button onClick={loadReflection} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Reflections</h1>
      </div>

      {userReflection ? (
        <div style={styles.reflectionContainer}>
          {/* Context Header */}
          <div style={styles.contextHeader}>
            <p style={styles.contextLine}>
              Reflection on "{userReflection.artwork?.title || 'Your Artwork'}"
            </p>
            <p style={styles.generatedDate}>
              {formatDate(userReflection.createdAt)}
            </p>
          </div>

          {/* Main Reflection Content */}
          <div style={styles.reflectionContent}>
            <div style={styles.reflectionText}>
              {userReflection.content}
            </div>
          </div>

          {/* Context Note */}
          <div style={styles.contextNote}>
            <p style={styles.noteText}>
              This reflection is an interpretation, not a judgment. It may evolve as your creative work grows.
            </p>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button 
              onClick={handleBackToArtwork}
              className="btn btn-secondary"
              style={styles.backButton}
            >
              Back to My Artwork
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3 className="empty-state-title">No reflections yet</h3>
          <p className="empty-state-description">
            Reflections become available after you upload an artwork.
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
  reflectionContainer: {
    maxWidth: '700px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-8)',
  },
  contextHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    paddingBottom: 'var(--space-6)',
    borderBottom: '1px solid var(--color-gray-200)',
  },
  contextLine: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-600)',
    margin: 0,
  },
  generatedDate: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-gray-400)',
    margin: 0,
  },
  reflectionContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  reflectionText: {
    fontSize: 'var(--font-size-lg)',
    lineHeight: 'var(--line-height-relaxed)',
    color: 'var(--color-gray-800)',
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  contextNote: {
    paddingTop: 'var(--space-6)',
    borderTop: '1px solid var(--color-gray-200)',
  },
  noteText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-gray-500)',
    margin: 0,
    lineHeight: 'var(--line-height-normal)',
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-start',
    paddingTop: 'var(--space-4)',
  },
  backButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
  },
};

export default Reflections;