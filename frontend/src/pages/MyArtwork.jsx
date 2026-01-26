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
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Artwork</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 className="empty-state-title">Error loading artwork</h3>
          <p className="empty-state-description">{error}</p>
          <button onClick={loadArtwork} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Artwork</h1>
        <p className="dashboard-subtitle">Your creative expression</p>
      </div>

      {userArtwork ? (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header">
            <h2 className="card-title">{userArtwork.title}</h2>
            <p className="card-subtitle">
              Created {new Date(userArtwork.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {userArtwork.imageUrl && (
            <div style={{ 
              marginBottom: 'var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--color-gray-200)'
            }}>
              <img
                src={userArtwork.imageUrl}
                alt={userArtwork.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '500px',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}

          {userArtwork.description && (
            <div style={{ 
              padding: 'var(--space-6)',
              background: 'var(--color-gray-50)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-6)'
            }}>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-gray-800)',
                marginBottom: 'var(--space-3)'
              }}>
                Description
              </h3>
              <p style={{
                fontSize: 'var(--font-size-base)',
                lineHeight: 'var(--line-height-relaxed)',
                color: 'var(--color-gray-600)',
                margin: 0
              }}>
                {userArtwork.description}
              </p>
            </div>
          )}

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--space-4)',
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--color-gray-200)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '24px',
                marginBottom: 'var(--space-2)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21,15 16,10 5,21"></polyline>
                </svg>
              </div>
              <div style={{ 
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-gray-500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-1)'
              }}>
                Type
              </div>
              <div style={{ 
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-gray-800)'
              }}>
                {userArtwork.imageUrl && userArtwork.description ? 'Image + Text' :
                 userArtwork.imageUrl ? 'Image' : 'Text'}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '24px',
                marginBottom: 'var(--space-2)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              </div>
              <div style={{ 
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-gray-500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-1)'
              }}>
                Status
              </div>
              <div style={{ 
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-gray-800)'
              }}>
                Complete
              </div>
            </div>
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
          <h3 className="empty-state-title">No artwork yet</h3>
          <p className="empty-state-description">
            You haven't created any artwork yet. Your creative journey begins with your first piece.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyArtwork;