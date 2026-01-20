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
        <div style={styles.loadingState} className="pinterest-card floating">
          <div className="spinner"></div>
          <p style={styles.loadingText}>Loading your creative dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title} className="gradient-text">
          ✨ Creative Dashboard
        </h1>
        <p style={styles.subtitle}>Welcome back, {currentUser?.name}</p>
      </div>

      <div className="responsive-grid grid-3">
        {/* Artwork Status Card */}
        <div className="card-responsive">
          <div style={styles.card} className="pinterest-card">
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>My Artwork</h3>
              <span style={styles.cardIcon} className="icon-hover floating">🎨</span>
            </div>
            <div style={styles.cardContent}>
              {userArtwork ? (
                <div>
                  <p style={styles.cardValue} className="gradient-text">1</p>
                  <p style={styles.cardLabel}>Masterpiece Created</p>
                  <div style={styles.artworkPreview} className="glass-card">
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
                  <div style={styles.emptyIcon} className="floating">🎭</div>
                  <p style={styles.emptyStateText}>No artwork created yet</p>
                  <p style={styles.emptyStateSubtext}>Create your first masterpiece to begin your creative journey</p>
                  {onNavigate && (
                    <button 
                      onClick={() => onNavigate('add-artwork')}
                      style={styles.actionButton}
                      className="btn-primary icon-hover"
                    >
                      ✨ Create Artwork
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reflection Status Card */}
        <div className="card-responsive">
          <div style={styles.card} className="pinterest-card">
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Reflections</h3>
              <span style={styles.cardIcon} className="icon-hover floating">💭</span>
            </div>
            <div style={styles.cardContent}>
              {userReflection ? (
                <div>
                  <p style={styles.cardValue} className="gradient-text">1</p>
                  <p style={styles.cardLabel}>Deep Reflection</p>
                  <div style={styles.reflectionPreview} className="glass-card">
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
                  <div style={styles.emptyIcon} className="floating">🌟</div>
                  <p style={styles.emptyStateText}>No reflection yet</p>
                  <p style={styles.emptyStateSubtext}>Generate a reflection for your artwork</p>
                  {onNavigate && (
                    <button 
                      onClick={() => onNavigate('reflections')}
                      style={styles.actionButton}
                      className="btn-primary icon-hover"
                    >
                      💭 View Reflections
                    </button>
                  )}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon} className="floating">🎪</div>
                  <p style={styles.emptyStateText}>No reflections</p>
                  <p style={styles.emptyStateSubtext}>Create artwork first to generate reflections</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="card-responsive">
          <div style={styles.card} className="pinterest-card">
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Account</h3>
              <span style={styles.cardIcon} className="icon-hover floating">👤</span>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.accountInfo}>
                <div style={styles.accountField}>
                  <span style={styles.accountLabel}>🏷️ Name</span>
                  <span style={styles.accountValue}>{currentUser?.name}</span>
                </div>
                <div style={styles.accountField}>
                  <span style={styles.accountLabel}>📧 Email</span>
                  <span style={styles.accountValue}>{currentUser?.email}</span>
                </div>
                <div style={styles.accountField}>
                  <span style={styles.accountLabel}>🔐 Auth Method</span>
                  <span style={styles.accountValue}>
                    {currentUser?.authProvider === 'google' ? '🔍 Google' : '📧 Email'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inspirational Quote Card - Large Card */}
        <div className="card-responsive card-large">
          <div style={styles.card} className="pinterest-card">
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Daily Inspiration</h3>
              <span style={styles.cardIcon} className="icon-hover floating">🌈</span>
            </div>
            <div style={styles.cardContent}>
              <div style={styles.quoteCard} className="glass-card">
                <p style={styles.quote}>
                  "Every artist was first an amateur. Every pro was once a beginner."
                </p>
                <p style={styles.quoteAuthor}>— Robin Sharma</p>
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
    width: '100%',
    margin: '0',
    padding: '0',
  },
  header: {
    marginBottom: '40px',
    textAlign: 'center',
  },
  title: {
    fontSize: '42px',
    fontWeight: '800',
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em',
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  },
  subtitle: {
    fontSize: '18px',
    color: 'var(--text-secondary)',
    margin: 0,
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    fontWeight: '500',
  },
  card: {
    background: 'var(--card-bg)',
    borderRadius: '25px',
    padding: '32px',
    boxShadow: 'var(--card-shadow)',
    border: '1px solid var(--border-primary)',
    backdropFilter: 'blur(20px)',
    transition: 'all 0.3s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  cardIcon: {
    fontSize: '24px',
    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))',
  },
  cardContent: {
    minHeight: '120px',
  },
  cardValue: {
    fontSize: '48px',
    fontWeight: '800',
    margin: '0 0 8px 0',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  cardLabel: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 20px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: '600',
  },
  artworkPreview: {
    padding: '24px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.08), rgba(232, 196, 160, 0.08))',
    border: '1px solid rgba(212, 165, 116, 0.15)',
  },
  artworkTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2C2C2C',
    margin: '0 0 12px 0',
  },
  artworkDescription: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
    margin: 0,
  },
  reflectionPreview: {
    padding: '20px',
    borderRadius: '15px',
    background: 'rgba(229, 224, 184, 0.1)',
    border: '1px solid rgba(229, 224, 184, 0.2)',
  },
  reflectionType: {
    fontSize: '12px',
    color: '#A69B7B',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin: '0 0 12px 0',
    fontWeight: '700',
  },
  reflectionSnippet: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '20px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    display: 'block',
  },
  emptyStateText: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 8px 0',
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: '14px',
    color: '#999',
    margin: '0 0 20px 0',
    lineHeight: '1.5',
  },
  actionButton: {
    padding: '14px 28px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  accountField: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  },
  accountLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '600',
  },
  accountValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: '600',
  },
  quoteCard: {
    padding: '25px',
    borderRadius: '15px',
    background: 'linear-gradient(135deg, rgba(239, 235, 206, 0.1), rgba(229, 224, 184, 0.1))',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
  quote: {
    fontSize: '16px',
    fontStyle: 'italic',
    color: '#374151',
    lineHeight: '1.6',
    margin: '0 0 12px 0',
    fontWeight: '500',
  },
  quoteAuthor: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '600',
    margin: 0,
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '25px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
    marginTop: '20px',
    fontWeight: '500',
  },
};

export default Dashboard;