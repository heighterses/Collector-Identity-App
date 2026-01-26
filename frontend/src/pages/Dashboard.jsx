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
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, {currentUser?.name}</h1>
        <p className="dashboard-subtitle">Your creative journey continues</p>
      </div>

      <div className="dashboard-grid">
        {/* Artwork Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Artwork</h2>
          </div>
          
          <div className="section-content">
            {userArtwork ? (
              <div className="content-card">
                <h3 className="content-title">{userArtwork.title}</h3>
                {userArtwork.description && (
                  <p className="content-description">
                    {userArtwork.description.length > 120 
                      ? `${userArtwork.description.substring(0, 120)}...`
                      : userArtwork.description
                    }
                  </p>
                )}
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button 
                    onClick={() => onNavigate('my-artwork')}
                    className="btn btn-secondary"
                  >
                    View details
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21,15 16,10 5,21"></polyline>
                  </svg>
                </div>
                <h3 className="empty-state-title">Add your first artwork</h3>
                <p className="empty-state-description">
                  Begin exploring your creative identity by adding a piece that speaks to you.
                </p>
                <button 
                  onClick={() => onNavigate('add-artwork')}
                  className="btn btn-primary"
                >
                  Add artwork
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Reflections Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Reflections</h2>
          </div>
          
          <div className="section-content">
            {userReflection ? (
              <div className="content-card">
                <div className="content-meta">{userReflection.type.replace('_', ' ')}</div>
                <p className="content-description">
                  {userReflection.content.length > 150 
                    ? `${userReflection.content.substring(0, 150)}...`
                    : userReflection.content
                  }
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button 
                    onClick={() => onNavigate('reflections')}
                    className="btn btn-secondary"
                  >
                    Read full reflection
                  </button>
                </div>
              </div>
            ) : userArtwork ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                  </svg>
                </div>
                <h3 className="empty-state-title">Create your first reflection</h3>
                <p className="empty-state-description">
                  Generate insights and discover deeper meaning in your artwork.
                </p>
                <button 
                  onClick={() => onNavigate('reflection')}
                  className="btn btn-primary"
                >
                  Create reflection
                </button>
              </div>
            ) : (
              <div className="empty-state" style={{ opacity: 0.6 }}>
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                  </svg>
                </div>
                <h3 className="empty-state-title">Reflections await</h3>
                <p className="empty-state-description">
                  Add artwork first to unlock thoughtful reflections.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Overview</h2>
          </div>
          
          <div className="section-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="summary-card">
                <div className="summary-value">{userArtwork ? '1' : '0'}</div>
                <div className="summary-label">Artwork</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{userReflection ? '1' : '0'}</div>
                <div className="summary-label">Reflections</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;