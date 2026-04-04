import { useState, useEffect } from 'react';
import { reflection } from '../api.js';
import { formatDate } from '../utils/dateUtils.js';

const Reflections = ({ onNavigate, currentUser }) => {
  const [userReflection, setUserReflection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ NEW STATE
  const [userInput, setUserInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ REFINE FUNCTION
  const handleRefine = async () => {
    if (!userInput.trim()) {
      alert("Please enter your thoughts");
      return;
    }

    try {
      setLoadingAI(true);

      const res = await reflection.refine({
        user_input: userInput
      });

      if (res?.reflection) {
        setUserReflection(res.reflection);
      }

      setUserInput('');
    } catch (err) {
      console.error(err);
      alert("Refinement failed");
    } finally {
      setLoadingAI(false);
    }
  };

  // ✅ REGENERATE FUNCTION
  const handleRegenerate = async () => {
    try {
      setLoadingAI(true);

      const res = await reflection.regenerate();

      if (res?.reflection) {
        setUserReflection(res.reflection);
      }
    } catch (err) {
      console.error(err);
      alert("Regeneration failed");
    } finally {
      setLoadingAI(false);
    }
  };

  const formatReflectionDate = (dateString) => {
    return formatDate(
      dateString, 
      currentUser?.timezone || 'UTC', 
      currentUser?.language || 'en'
    );
  };

  const handleAddArtwork = () => {
    if (onNavigate) onNavigate('add-artwork');
  };

  const handleBackToArtwork = () => {
    if (onNavigate) onNavigate('my-artwork');
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
          
          {/* HEADER */}
          <div style={styles.contextHeader}>
            <p style={styles.contextLine}>
              Reflection on "{userReflection.artwork?.title || 'Your Artwork'}"
            </p>
            <p style={styles.generatedDate}>
              {formatReflectionDate(userReflection.created_at)}
            </p>
          </div>

          {/* CONTENT */}
          <div style={styles.reflectionContent}>
            <div style={styles.reflectionText}>
              {userReflection.content}
            </div>
          </div>

          {/* ✅ NEW AI INPUT SECTION */}
          <div style={styles.aiBox}>
            <textarea
              placeholder="Add your thoughts to refine this reflection..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              style={styles.textarea}
            />

            <div style={styles.buttonRow}>
              <button 
                onClick={handleRefine} 
                disabled={loadingAI}
                className="btn btn-primary"
              >
                {loadingAI ? "Refining..." : "Refine"}
              </button>

              <button 
                onClick={handleRegenerate} 
                disabled={loadingAI}
                className="btn btn-secondary"
              >
                {loadingAI ? "Generating..." : "Regenerate"}
              </button>
            </div>
          </div>

          {/* NOTE */}
          <div style={styles.contextNote}>
            <p style={styles.noteText}>
              This reflection evolves with your input.
            </p>
          </div>

          {/* ACTIONS */}
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
          <h3>No reflections yet</h3>
          <button onClick={handleAddArtwork} className="btn btn-primary">
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
    gap: '20px',
  },
  contextHeader: {
    borderBottom: '1px solid #ddd',
    paddingBottom: '10px',
  },
  reflectionContent: {},
  reflectionText: {
    fontSize: '18px',
    whiteSpace: 'pre-wrap',
  },

  // ✅ NEW STYLES
  aiBox: {
    marginTop: '20px',
  },
  textarea: {
    width: '100%',
    minHeight: '80px',
    padding: '10px',
    marginBottom: '10px',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
  },

  contextNote: {},
  noteText: {},
  actions: {},
  backButton: {},
};

export default Reflections;