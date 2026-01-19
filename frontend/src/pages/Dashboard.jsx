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
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Welcome back, {currentUser?.name}</p>
      </div>

      <div style={styles.grid}>
        {/* Artwork Status Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>My Artwork</h3>
            <span style={styles.cardIcon}>🎨</span>
          </div>
          <div style={styles.cardContent}>
            {userArtwork ? (
              <div>
                <p style={styles.cardValue}>1</p>
                <p style={styles.cardLabel}>Artwork Created</p>
                <div style={styles.artworkPreview}>
                  <h4 style={styles.artworkTitle}>{userArtwork.title}</h4>
                  {userArtwork.description && (
                    <p style={styles.artworkDescription}>
                      {userArtwork.description.length > 100 
                        ? `${userArtwork.description.substring(0, 100)}...`
                        : userArtwork.description
                      }
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyStateText}>No artwork created yet</p>
                <p style={styles.emptyStateSubtext}>Create your first artwork to begin your creative journey</p>
                {onNavigate && (
                  <button 
                    onClick={() => onNavigate('add-artwork')}
                    style={styles.actionButton}
                  >
                    Create Artwork
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reflection Status Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Reflections</h3>
            <span style={styles.cardIcon}>💭</span>
          </div>
          <div style={styles.cardContent}>
            {userReflection ? (
              <div>
                <p style={styles.cardValue}>1</p>
                <p style={styles.cardLabel}>Reflection Generated</p>
                <div style={styles.reflectionPreview}>
                  <p style={styles.reflectionType}>{userReflection.type.replace('_', ' ')}</p>
                  <p style={styles.reflectionSnippet}>
                    {userReflection.content.length > 120 
                      ? `${userReflection.content.substring(0, 120)}...`
                      : userReflection.content
                    }
                  </p>
                </div>
              </div>
            ) : userArtwork ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyStateText}>No reflection yet</p>
                <p style={styles.emptyStateSubtext}>Generate a reflection for your artwork</p>
                {onNavigate && (
                  <button 
                    onClick={() => onNavigate('reflections')}
                    style={styles.actionButton}
                  >
                    View Reflections
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyStateText}>No reflections</p>
                <p style={styles.emptyStateSubtext}>Create artwork first to generate reflections</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Info Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Account</h3>
            <span style={styles.cardIcon}>👤</span>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.accountInfo}>
              <div style={styles.accountField}>
                <span style={styles.accountLabel}>Name</span>
                <span style={styles.accountValue}>{currentUser?.name}</span>
              </div>
              <div style={styles.accountField}>
                <span style={styles.accountLabel}>Email</span>
                <span style={styles.accountValue}>{currentUser?.email}</span>
              </div>
              <div style={styles.accountField}>
                <span style={styles.accountLabel}>Auth Method</span>
                <span style={styles.accountValue}>
                  {currentUser?.authProvider === 'google' ? 'Google' : 'Email'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f0f0f0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: 0,
  },
  cardIcon: {
    fontSize: '20px',
  },
  cardContent: {
    minHeight: '120px',
  },
  cardValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 4px 0',
  },
  cardLabel: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  artworkPreview: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
  },
  artworkTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  artworkDescription: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
    margin: 0,
  },
  reflectionPreview: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
  },
  reflectionType: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 8px 0',
  },
  reflectionSnippet: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.5',
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 16px',
  },
  emptyStateText: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 8px 0',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  actionButton: {
    marginTop: '16px',
    padding: '12px 24px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  accountField: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  accountValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: '500',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    textAlign: 'center',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #1a1a1a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
};

export default Dashboard;