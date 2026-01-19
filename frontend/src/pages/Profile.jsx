import { useState, useEffect } from 'react';
import { artwork, reflection } from '../api.js';

const Profile = ({ currentUser }) => {
  const [userArtwork, setUserArtwork] = useState(null);
  const [userReflection, setUserReflection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    
    try {
      // Load artwork
      try {
        const artworkData = await artwork.getMine();
        setUserArtwork(artworkData.artwork);
      } catch (artworkErr) {
        setUserArtwork(null);
      }

      // Load reflection
      try {
        const reflectionData = await reflection.getMine();
        setUserReflection(reflectionData.reflection);
      } catch (reflectionErr) {
        setUserReflection(null);
      }
    } catch (error) {
      console.error('Profile data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Profile</h1>
        <p style={styles.subtitle}>Your creative identity overview</p>
      </div>

      <div style={styles.profileGrid}>
        {/* Personal Information Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Personal Information</h3>
            <span style={styles.cardIcon}>👤</span>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.profileInfo}>
              <div style={styles.profileField}>
                <span style={styles.fieldLabel}>Full Name</span>
                <span style={styles.fieldValue}>{currentUser?.name || 'Not provided'}</span>
              </div>
              <div style={styles.profileField}>
                <span style={styles.fieldLabel}>Email Address</span>
                <span style={styles.fieldValue}>{currentUser?.email || 'Not provided'}</span>
              </div>
              <div style={styles.profileField}>
                <span style={styles.fieldLabel}>Authentication Method</span>
                <span style={styles.fieldValue}>
                  {currentUser?.authProvider === 'google' ? 'Google Sign-In' : 'Email & Password'}
                </span>
              </div>
              <div style={styles.profileField}>
                <span style={styles.fieldLabel}>Member Since</span>
                <span style={styles.fieldValue}>
                  {currentUser?.createdAt 
                    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Unknown'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Creative Journey Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Creative Journey</h3>
            <span style={styles.cardIcon}>🎨</span>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.journeyStats}>
              <div style={styles.stat}>
                <span style={styles.statValue}>{userArtwork ? '1' : '0'}</span>
                <span style={styles.statLabel}>Artwork Created</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statValue}>{userReflection ? '1' : '0'}</span>
                <span style={styles.statLabel}>Reflection Generated</span>
              </div>
            </div>

            {userArtwork && (
              <div style={styles.currentArtwork}>
                <h4 style={styles.currentArtworkTitle}>Current Artwork</h4>
                <div style={styles.artworkSummary}>
                  <span style={styles.artworkTitle}>{userArtwork.title}</span>
                  <span style={styles.artworkDate}>
                    Created {new Date(userArtwork.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Status Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Account Status</h3>
            <span style={styles.cardIcon}>✅</span>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.statusList}>
              <div style={styles.statusItem}>
                <span style={styles.statusIcon}>✅</span>
                <span style={styles.statusText}>Account Verified</span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusIcon}>
                  {currentUser?.authProvider === 'google' ? '🔗' : '🔐'}
                </span>
                <span style={styles.statusText}>
                  {currentUser?.authProvider === 'google' 
                    ? 'Google Account Linked' 
                    : 'Email Authentication Active'
                  }
                </span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusIcon}>
                  {userArtwork ? '🎨' : '⏳'}
                </span>
                <span style={styles.statusText}>
                  {userArtwork ? 'Artwork Created' : 'Artwork Pending'}
                </span>
              </div>
              <div style={styles.statusItem}>
                <span style={styles.statusIcon}>
                  {userReflection ? '💭' : '⏳'}
                </span>
                <span style={styles.statusText}>
                  {userReflection ? 'Reflection Generated' : 'Reflection Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Progress Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Milestone 1 Progress</h3>
            <span style={styles.cardIcon}>🎯</span>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.milestoneProgress}>
              <div style={styles.progressHeader}>
                <span style={styles.progressTitle}>Creative Identity Foundation</span>
                <span style={styles.progressPercentage}>
                  {userReflection ? '100%' : userArtwork ? '50%' : '0%'}
                </span>
              </div>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: userReflection ? '100%' : userArtwork ? '50%' : '0%'
                  }}
                ></div>
              </div>
              <div style={styles.milestoneSteps}>
                <div style={{
                  ...styles.step,
                  ...(currentUser ? styles.stepComplete : {})
                }}>
                  <span style={styles.stepNumber}>1</span>
                  <span style={styles.stepText}>Account Created</span>
                </div>
                <div style={{
                  ...styles.step,
                  ...(userArtwork ? styles.stepComplete : {})
                }}>
                  <span style={styles.stepNumber}>2</span>
                  <span style={styles.stepText}>Artwork Submitted</span>
                </div>
                <div style={{
                  ...styles.step,
                  ...(userReflection ? styles.stepComplete : {})
                }}>
                  <span style={styles.stepNumber}>3</span>
                  <span style={styles.stepText}>Reflection Generated</span>
                </div>
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
    maxWidth: '1000px',
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
  profileGrid: {
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
    marginBottom: '20px',
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
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  profileField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: '500',
  },
  journeyStats: {
    display: 'flex',
    gap: '32px',
    marginBottom: '20px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '500',
  },
  currentArtwork: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e8e8e8',
  },
  currentArtworkTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  artworkSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  artworkTitle: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  artworkDate: {
    fontSize: '12px',
    color: '#666',
  },
  statusList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
  },
  statusText: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  milestoneProgress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressPercentage: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#059669',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #059669, #10b981)',
    transition: 'width 0.3s ease',
  },
  milestoneSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    opacity: 0.5,
  },
  stepComplete: {
    opacity: 1,
  },
  stepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#f0f0f0',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
  },
  stepText: {
    fontSize: '14px',
    color: '#374151',
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

export default Profile;