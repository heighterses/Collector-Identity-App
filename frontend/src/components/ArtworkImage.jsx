import { useState, useEffect, useRef } from 'react';

/**
 * ArtworkImage — robust image renderer for all artwork contexts.
 *
 * Handles:
 * - Loading skeleton while image fetches
 * - Error fallback with styled placeholder (not plain text)
 * - URL normalization (relative /api/images/... paths work via Vite proxy)
 * - Retry on transient failure (once)
 * - Text artwork placeholder
 * - Aspect ratio preservation
 */

const PlaceholderIcon = ({ color = 'currentColor' }) => (
  <svg
    width="40" height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21,15 16,10 5,21" />
  </svg>
);

const TextArtworkIcon = ({ color = 'currentColor' }) => (
  <svg
    width="40" height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

/**
 * Normalize image URL:
 * - Already absolute (http/https) → use as-is
 * - Starts with /api/images/ → use as-is (Vite proxy handles it)
 * - Just a filename or object key → prepend /api/images/
 */
function normalizeImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/images/')) return url;
  if (url.startsWith('/')) return url;
  // bare object key like "artworks/user-1/..."
  return `/api/images/${url}`;
}

const ArtworkImage = ({
  src,
  alt = 'Artwork',
  artworkType = 'image',
  variant = 'full',   // 'full' | 'thumb' | 'feature'
  className = '',
  style = {},
  onClick,
}) => {
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [retried, setRetried] = useState(false);
  const imgRef = useRef(null);

  const normalizedSrc = normalizeImageUrl(src);
  const isTextArtwork = artworkType === 'text';
  const hasImageSrc = !isTextArtwork && normalizedSrc;

  // Reset state when src changes
  useEffect(() => {
    if (hasImageSrc) {
      setStatus('loading');
      setRetried(false);
    } else {
      setStatus('loaded'); // text artwork — no image to load
    }
  }, [src, artworkType]);

  const handleLoad = () => setStatus('loaded');

  const handleError = () => {
    if (!retried && normalizedSrc) {
      // Retry once after 800ms (handles transient MinIO/proxy hiccups)
      setRetried(true);
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.src = normalizedSrc + (normalizedSrc.includes('?') ? '&' : '?') + '_retry=' + Date.now();
        }
      }, 800);
    } else {
      setStatus('error');
    }
  };

  // Variant-specific container styles
  // 'full'    → height grows with image (no fixed aspect ratio)
  // 'feature' → fixed 16/9 aspect ratio (dashboard preview)
  // 'thumb'   → fixed 4/3 aspect ratio
  const containerStyles = {
    full: {
      width: '100%',
      background: '#0d0d0b',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 280,
      // height is determined by image content
    },
    feature: {
      width: '100%',
      aspectRatio: '16/9',
      background: '#0d0d0b',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 'var(--r-xs)',
    },
    thumb: {
      width: '100%',
      aspectRatio: '4/3',
      background: '#0d0d0b',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 'var(--r-xs)',
    },
  };

  const containerStyle = { ...containerStyles[variant] || containerStyles.full, ...style };

  // ── Text artwork ──────────────────────────────────────────
  if (isTextArtwork) {
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          background: '#1a1a18',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--sp-4)',
          padding: 'var(--sp-12)',
          cursor: onClick ? 'pointer' : 'default',
        }}
        onClick={onClick}
      >
        <TextArtworkIcon color="rgba(255,255,255,0.2)" />
        <span style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
          Text artwork
        </span>
      </div>
    );
  }

  // ── No src ────────────────────────────────────────────────
  if (!normalizedSrc) {
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--sp-3)',
          cursor: onClick ? 'pointer' : 'default',
        }}
        onClick={onClick}
      >
        <PlaceholderIcon color="rgba(255,255,255,0.15)" />
        <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          No image
        </span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ ...containerStyle, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {/* Loading skeleton — sits on top while image is invisible */}
      {status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #1a1a18 25%, #252520 50%, #1a1a18 75%)',
            backgroundSize: '600px 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
            zIndex: 1,
            // For 'full' variant the container min-height keeps this visible
            minHeight: variant === 'full' ? 280 : undefined,
          }}
        />
      )}

      {/* Error fallback */}
      {status === 'error' && (
        <div
          style={{
            position: variant === 'full' ? 'relative' : 'absolute',
            inset: variant === 'full' ? undefined : 0,
            minHeight: variant === 'full' ? 280 : undefined,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--sp-4)',
            background: '#1a1a18',
            zIndex: 1,
            width: '100%',
          }}
        >
          <div style={{
            width: 64, height: 64,
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <PlaceholderIcon color="rgba(255,255,255,0.15)" />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.06) 55%, transparent 55%)',
              borderRadius: 4,
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.25)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Image unavailable
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.15)', margin: 0 }}>{alt}</p>
          </div>
        </div>
      )}

      {/* The actual image — hidden until loaded, then fades in */}
      {status !== 'error' && (
        <img
          ref={imgRef}
          src={normalizedSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            display: 'block',
            width: '100%',
            // full: natural height up to 70vh; feature/thumb: fill container
            height: variant === 'full' ? 'auto' : '100%',
            maxHeight: variant === 'full' ? '70vh' : undefined,
            objectFit: variant === 'full' ? 'contain' : 'cover',
            opacity: status === 'loaded' ? 1 : 0,
            transition: 'opacity 0.5s ease',
            // full: in normal flow so container grows; others: absolute fill
            position: variant === 'full' ? 'relative' : 'absolute',
            inset: variant === 'full' ? undefined : 0,
            zIndex: 0,
          }}
        />
      )}
    </div>
  );
};

export default ArtworkImage;
