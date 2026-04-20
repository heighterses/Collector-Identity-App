import { useState, useEffect } from 'react';
import { reflection } from '../api.js';
import { formatDate } from '../utils/dateUtils.js';

const Reflections = ({ onNavigate, currentUser }) => {
  const [userReflection, setUserReflection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInput, setUserInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAction, setAiAction] = useState('');

  useEffect(() => { loadReflection(); }, []);

  const loadReflection = async () => {
    setLoading(true); setError('');
    try {
      const d = await reflection.getMine();
      setUserReflection(d.reflection);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED
  const handleRefine = async () => {
    if (!userInput.trim()) {
      alert("Please enter something before refining.");
      return;
    }

    if (!userReflection?.id) {
      alert("Reflection not loaded properly.");
      return;
    }

    setLoadingAI(true);
    setAiAction('refine');

    try {
      const res = await reflection.refine(
        userReflection.id,
        userInput
      );

      if (res?.reflection) {
        setUserReflection(res.reflection);
      }

      setUserInput('');
    } catch (err) {
      console.error(err);
      alert("Refinement failed");
    } finally {
      setLoadingAI(false);
      setAiAction('');
    }
  };

  const handleRegenerate = async () => {
    setLoadingAI(true);
    setAiAction('regenerate');

    try {
      const res = await reflection.regenerate();

      if (res?.reflection) {
        setUserReflection(res.reflection); // ✅ now updates UI
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
      setAiAction('');
    }
  };

  const fmtDate = (d) => formatDate(d, currentUser?.timezone || 'UTC', currentUser?.language || 'en');

  if (loading) return <div>Loading...</div>;

  if (error || !userReflection) {
    return (
      <div>
        <h2>No reflection yet</h2>
        <button onClick={() => onNavigate('add-artwork')}>Add artwork</button>
      </div>
    );
  }

  return (
    <div>
      <h1>{userReflection.artwork?.title || 'Your Artwork'}</h1>
      <p>{fmtDate(userReflection.created_at)}</p>

      <p>{userReflection.content}</p>

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
      />

      <button onClick={handleRefine} disabled={!userInput.trim()}>
        Refine
      </button>

      <button onClick={handleRegenerate}>
        Regenerate
      </button>
    </div>
  );
};

export default Reflections;