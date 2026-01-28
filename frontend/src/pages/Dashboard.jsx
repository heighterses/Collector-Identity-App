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
      <div className="dashboard-container">
        <div className="empty-state">
          <p>Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, {currentUser?.name}</h1>
        <p className="dashboard-subtitle">Your creative journey continues</p>
      </div>

      <div className="dashboard-grid">
        {/* Artwork Section - Primary Focus */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Your Artwork</h2>
          </div>
          
          <div className="section-content">
            {userArtwork ? (
              <div className="artwork-display">
                <div className="artwork-meta">
                  <h3>{userArtwork.title}</h3>
                  {userArtwork.description && (
                    <p>{userArtwork.description}</p>
                  )}
                  <div className="artwork-actions">
                    <button 
                      onClick={() => onNavigate('my-artwork')}
                      className="btn btn-secondary"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <h3 className="empty-state-title">Ready to begin?</h3>
                <p className="empty-state-description">
                  Add your first piece to start exploring your creative identity.
                </p>
                <button 
                  onClick={() => onNavigate('add-artwork')}
                  className="btn btn-primary"
                >
                  Add Your Artwork
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Reflections Section - Secondary */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Reflections</h2>
          </div>
          
          <div className="section-content">
            {userReflection ? (
              <div className="card">
                <div className="card-content">
                  <div className="reflection-meta">
                    <span className="text-gray-500 font-medium text-sm">
                      {userReflection.type.replace('_', ' ')}
                    </span>
                    <p className="text-gray-600 mb-4">
                      {userReflection.content.length > 160 
                        ? `${userReflection.content.substring(0, 160)}...`
                        : userReflection.content
                      }
                    </p>
                    <button 
                      onClick={() => onNavigate('reflections')}
                      className="btn btn-secondary"
                    >
                      Read Full Reflection
                    </button>
                  </div>
                </div>
              </div>
            ) : userArtwork ? (
              <div className="empty-state">
                <h3 className="empty-state-title">Generate insights</h3>
                <p className="empty-state-description">
                  Create a reflection about your artwork to discover deeper meaning.
                </p>
                <button 
                  onClick={() => onNavigate('reflection')}
                  className="btn btn-secondary"
                >
                  Create Reflection
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <h3 className="empty-state-title">Reflections await</h3>
                <p className="empty-state-description">
                  Reflections will appear once you add your artwork.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;