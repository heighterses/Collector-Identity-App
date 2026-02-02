import { useState, useEffect } from 'react';
import { artwork, reflection } from '../api.js';

const Dashboard = ({ currentUser, onNavigate }) => {
  const [userArtwork, setUserArtwork] = useState(null);
  const [userReflection, setUserReflection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Try to load user's artwork
      try {
        const artworkData = await artwork.getMine();
        setUserArtwork(artworkData.artwork);
        
        // If artwork exists, try to load reflection
        try {
          const reflectionData = await reflection.getMine();
          setUserReflection(reflectionData.reflection);
        } catch (reflectionErr) {
          // No reflection yet
          setUserReflection(null);
        }
      } catch (artworkErr) {
        // No artwork yet
        setUserArtwork(null);
        setUserReflection(null);
      }
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="collection-overview">
        <div className="collection-loading">
          <p>Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-overview">
      {/* Header */}
      <div className="collection-header">
        <h1 className="dashboard-title">Your Collection</h1>
        <p className="collection-subtitle">Welcome back, {currentUser?.name}</p>
      </div>

      {/* Artwork Section - Primary Focus */}
      <section className="collection-section collection-section--primary">
        <div className="section-header">
          <h2 className="section-title">Artwork</h2>
        </div>
        
        <div className="section-content">
          {userArtwork ? (
            <div className="artwork-display">
              <div className="artwork-meta">
                <h3 className="artwork-title">{userArtwork.title}</h3>
                {userArtwork.description && (
                  <p className="artwork-description">
                    {userArtwork.description}
                  </p>
                )}
              </div>
              <div className="artwork-actions">
                {onNavigate && (
                  <button 
                    onClick={() => onNavigate('my-artwork')}
                    className="btn btn-primary"
                    style={styles.actionButton}
                  >
                    View details
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="collection-empty">
              <p className="empty-message">Add your first piece to begin exploring your creative identity.</p>
              {onNavigate && (
                <button 
                  onClick={() => onNavigate('add-artwork')}
                  className="btn btn-primary"
                  style={styles.actionButton}
                >
                  Add artwork
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Reflections Section - Secondary */}
      <section className="collection-section collection-section--secondary">
        <div className="section-header">
          <h2 className="section-title">Reflections</h2>
        </div>
        
        <div className="section-content">
          {userReflection ? (
            <div className="reflection-display">
              <div className="reflection-meta">
                <span className="reflection-type">{userReflection.type.replace('_', ' ')}</span>
                <p className="reflection-excerpt">
                  {userReflection.content.length > 160 
                    ? `${userReflection.content.substring(0, 160)}...`
                    : userReflection.content
                  }
                </p>
              </div>
              <div className="reflection-actions">
                {onNavigate && (
                  <button 
                    onClick={() => onNavigate('reflections')}
                    className="btn btn-primary"
                    style={styles.actionButton}
                  >
                    Read full reflection
                  </button>
                )}
              </div>
            </div>
          ) : userArtwork ? (
            <div className="collection-empty">
              <p className="empty-message">Your reflection is being generated automatically.</p>
              {onNavigate && (
                <button 
                  onClick={() => window.location.reload()}
                  className="btn btn-secondary"
                  style={styles.actionButton}
                >
                  Refresh page
                </button>
              )}
            </div>
          ) : (
            <div className="collection-empty collection-empty--quiet">
              <p className="empty-message">Reflections will appear automatically when you add artwork.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const styles = {
  actionButton: {
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
  },
};

export default Dashboard;