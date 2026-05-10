import { useEffect } from 'react';

/**
 * ReflectionPage — redirect shim
 *
 * This standalone page is no longer the primary reflection experience.
 * All reflection viewing now goes through the main Reflections page
 * (Reflections.jsx) which supports multi-artwork selection.
 *
 * This component is kept for deep-link / route compatibility only.
 * App.jsx routes `case 'reflection'` directly to Reflections with
 * initialArtworkId, so this file is only rendered if something else
 * explicitly mounts it. In that case it renders a minimal redirect notice.
 */
const ReflectionPage = ({ onNavigate, artwork }) => {
  // If onNavigate is available, immediately redirect to the reflections page
  // with the artwork pre-selected.
  useEffect(() => {
    if (onNavigate && artwork?.id) {
      onNavigate('reflection', artwork.id);
    } else if (onNavigate) {
      onNavigate('reflections');
    }
  }, []);

  // Render a brief loading state while the redirect fires
  return (
    <div style={{
      minHeight: '40vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 12,
      color: 'var(--gray-400)',
    }}>
      <div className="spinner" />
      <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Opening reflection…</p>
    </div>
  );
};

export default ReflectionPage;