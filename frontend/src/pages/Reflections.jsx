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
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Reflections</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
            </svg>
          </div>
          <h3 className="empty-state-title">Error loading reflections</h3>
          <p className="empty-state-description">{error}</p>
          <button onClick={loadReflectionData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Reflections</h1>
        <p className="dashboard-subtitle">Insights into your creative identity</p>
      </div>

      {userReflection ? (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <span style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-gray-500)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: '0.05em',
                padding: 'var(--space-1) var(--space-3)',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                textTransform: 'uppercase'
              }}>
                {userReflection.type.replace('_', ' ')}
              </span>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-gray-500)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Generated {new Date(userReflection.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div style={{
            marginBottom: 'var(--space-6)',
            padding: 'var(--space-8)',
            background: 'var(--color-gray-50)',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '4px solid var(--color-accent)'
          }}>
            <p style={{
              fontSize: 'var(--font-size-lg)',
              lineHeight: 'var(--line-height-relaxed)',
              color: 'var(--color-gray-700)',
              margin: 0
            }}>
              {userReflection.content}
            </p>
          </div>

          <div style={{
            padding: 'var(--space-5)',
            background: 'rgba(251, 191, 36, 0.1)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            marginBottom: 'var(--space-6)'
          }}>
            <p style={{
              fontSize: 'var(--font-size-sm)',
              color: 'rgb(146, 64, 14)',
              margin: 0,
              lineHeight: 'var(--line-height-relaxed)'
            }}>
              This interpretation is based on your submitted artwork and represents your creative identity at this moment. 
              It is part of your permanent creative record.
            </p>
          </div>

          {/* Show associated artwork */}
          {userReflection.artwork && (
            <div style={{
              borderTop: '1px solid var(--color-gray-200)',
              paddingTop: 'var(--space-6)'
            }}>
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-gray-800)',
                marginBottom: 'var(--space-4)'
              }}>
                Based on your artwork
              </h3>
              <div style={{
                padding: 'var(--space-5)',
                background: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-gray-200)'
              }}>
                <h4 style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-gray-800)',
                  marginBottom: 'var(--space-4)'
                }}>
                  {userReflection.artwork.title}
                </h4>
                
                {userReflection.artwork.imageUrl && (
                  <div style={{
                    marginBottom: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={userReflection.artwork.imageUrl}
                      alt={userReflection.artwork.title}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '200px',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}
                
                {userReflection.artwork.description && (
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-gray-600)',
                    lineHeight: 'var(--line-height-relaxed)',
                    margin: 0
                  }}>
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
      ) : userArtwork ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
            </svg>
          </div>
          <h3 className="empty-state-title">No reflection yet</h3>
          <p className="empty-state-description">
            You have created artwork but haven't generated a reflection yet. 
            A reflection provides insights into your creative identity based on your artwork.
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
            </svg>
          </div>
          <h3 className="empty-state-title">No reflections</h3>
          <p className="empty-state-description">
            Reflections are generated based on your artwork. Create your first artwork to begin receiving insights into your creative identity.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reflections;