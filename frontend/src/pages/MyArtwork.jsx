import React, { useState, useEffect, useRef } from 'react';
import { artwork, reflection, collections as collectionsApi } from '../api';
import ConfirmModal from '../components/ConfirmModal';

// ── Normalise image_url to a browser-reachable path ─────────────────────────
const normaliseImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('/api/images/')) return src;
  // Internal MinIO URL (http://minio:9000/... or localhost:9002/...)
  if (src.includes('minio:') || src.includes('localhost:9002') || src.includes('localhost:9000')) {
    const match = src.match(/\/artworks\/.+/);
    if (match) return `/api/images${match[0]}`;
    const bucketMatch = src.match(/artworks\/(.+)/);
    if (bucketMatch) return `/api/images/artworks/${bucketMatch[1]}`;
    return null;
  }
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/')) return src;
  return `/api/images/${src}`;
};

// ── Per-card image with loading/error states ─────────────────────────────────
const ArtworkCardImage = ({ src, alt, artworkType }) => {
  const [status, setStatus] = useState('loading');
  const [retried, setRetried] = useState(false);
  const imgRef = useRef(null);
  const isText = artworkType === 'text';
  const normalised = normaliseImageUrl(src);

  useEffect(() => {
    setStatus(isText || !normalised ? 'loaded' : 'loading');
    setRetried(false);
  }, [src, artworkType]);

  const handleError = () => {
    if (!retried && normalised) {
      setRetried(true);
      setTimeout(() => {
        if (imgRef.current) imgRef.current.src = normalised + '?_r=' + Date.now();
      }, 600);
    } else {
      setStatus('error');
    }
  };

  const placeholder = (label) => (
    <div className="ma-card-img ma-card-img--placeholder">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span>{label}</span>
    </div>
  );

  if (isText) return placeholder('Text artwork');
  if (!normalised) return placeholder('No image');

  return (
    <div className="ma-card-img">
      {status === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,#1a1a18 25%,#252520 50%,#1a1a18 75%)',
          backgroundSize: '600px 100%',
          animation: 'shimmer 1.8s ease-in-out infinite',
        }} />
      )}
      {status === 'error' && placeholder('Image unavailable')}
      <img
        ref={imgRef}
        src={normalised}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={handleError}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          opacity: status === 'loaded' ? 1 : 0,
          transition: 'opacity 0.45s ease, transform 0.5s ease',
          position: status === 'error' ? 'absolute' : 'relative',
        }}
      />
    </div>
  );
};

// ── Sort options for the toolbar's sort dropdown ─────────────────────────────
const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Date added — newest first' },
  { value: 'date-asc', label: 'Date added — oldest first' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
  { value: 'recent-reflection', label: 'Recently interpreted' },
];

// ── Main component ───────────────────────────────────────────────────────────
const MyArtwork = ({ artworks = [], onNavigate, onArtworkDeleted }) => {
  // Track which artworks have reflections
  const [reflectionMap, setReflectionMap] = useState({}); // artworkId → reflection | null
  const [loadingReflections, setLoadingReflections] = useState(true);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // artworkId pending deletion | null
  const [deleting, setDeleting]         = useState(false);

  // Track previous processing IDs so we can detect when they finish
  const prevProcessingIds = useRef(new Set());

  // ── M3-16: Collections (private, personal organization only) ─────────────
  const [myCollections, setMyCollections] = useState([]);
  const [activeCollectionId, setActiveCollectionId] = useState(null); // null = "All"
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [assignTargetId, setAssignTargetId] = useState('');
  const [applyingAssignment, setApplyingAssignment] = useState(false);

  // ── Sort & filter toolbar (client-side only, no new fetches) ─────────────
  const [sortBy, setSortBy] = useState('date-desc');
  const [reflectionFilter, setReflectionFilter] = useState('all'); // all | interpreted | awaiting

  useEffect(() => {
    collectionsApi.list().then(data => setMyCollections(data.collections || [])).catch(() => {});
  }, []);

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name || creatingCollection) return;
    setCreatingCollection(true);
    try {
      const res = await collectionsApi.create(name);
      if (res?.collection) {
        setMyCollections(prev => [...prev, res.collection]);
        setNewCollectionName('');
      }
    } catch (err) {
      console.error('Create collection failed:', err.message || err);
    } finally {
      setCreatingCollection(false);
    }
  };

  const toggleSelected = (artworkId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(artworkId)) next.delete(artworkId);
      else next.add(artworkId);
      return next;
    });
  };

  const refreshCollectionMembership = (collectionId, updated) => {
    setMyCollections(prev => prev.map(c => c.id === collectionId ? updated : c));
  };

  const handleAddSelectedToCollection = async () => {
    if (!assignTargetId || selectedIds.size === 0 || applyingAssignment) return;
    setApplyingAssignment(true);
    try {
      let latest = null;
      for (const artworkId of selectedIds) {
        const res = await collectionsApi.addArtwork(assignTargetId, artworkId);
        latest = res?.collection || latest;
      }
      if (latest) refreshCollectionMembership(assignTargetId, latest);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Add to collection failed:', err.message || err);
    } finally {
      setApplyingAssignment(false);
    }
  };

  const handleRemoveSelectedFromCollection = async () => {
    if (!assignTargetId || selectedIds.size === 0 || applyingAssignment) return;
    setApplyingAssignment(true);
    try {
      let latest = null;
      for (const artworkId of selectedIds) {
        const res = await collectionsApi.removeArtwork(assignTargetId, artworkId);
        latest = res?.collection || latest;
      }
      if (latest) refreshCollectionMembership(assignTargetId, latest);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Remove from collection failed:', err.message || err);
    } finally {
      setApplyingAssignment(false);
    }
  };

  const activeCollection = myCollections.find(c => c.id === activeCollectionId) || null;
  const collectionFiltered = activeCollection
    ? artworks.filter(a => activeCollection.artwork_ids?.includes(a.id))
    : artworks;

  const statusFiltered = collectionFiltered.filter(a => {
    // Don't filter out anything while reflections are still loading —
    // avoids a flash of an empty grid on first render.
    if (reflectionFilter === 'all' || loadingReflections) return true;
    const hasReflection = !!reflectionMap[a.id];
    return reflectionFilter === 'interpreted' ? hasReflection : !hasReflection;
  });

  const visibleArtworks = [...statusFiltered].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'title-asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'title-desc':
        return (b.title || '').localeCompare(a.title || '');
      case 'recent-reflection': {
        const ra = reflectionMap[a.id];
        const rb = reflectionMap[b.id];
        if (ra && rb) return new Date(rb.created_at) - new Date(ra.created_at);
        if (ra && !rb) return -1;
        if (!ra && rb) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      }
      case 'date-desc':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const hasActiveFilters = activeCollectionId !== null || reflectionFilter !== 'all';
  const clearFilters = () => {
    setActiveCollectionId(null);
    setReflectionFilter('all');
  };

  // Initial load: fetch reflection status for all artworks
  useEffect(() => {
    if (!artworks.length) {
      setReflectionMap({});
      setLoadingReflections(false);
      return;
    }
    loadAllReflections();
  }, [artworks.map(a => a.id).join(',')]);

  // Reactive update: when an artwork transitions OUT of 'processing',
  // fetch its reflection immediately without reloading the whole map.
  useEffect(() => {
    const currentProcessingIds = new Set(
      artworks.filter(a => a.status === 'processing').map(a => a.id)
    );

    // Find IDs that were processing on the last render but are no longer
    const justFinished = [...prevProcessingIds.current].filter(
      id => !currentProcessingIds.has(id)
    );

    if (justFinished.length > 0) {
      // Re-check only the newly completed artworks
      justFinished.forEach(id => refreshReflectionForArtwork(id));
    }

    prevProcessingIds.current = currentProcessingIds;
  }, [artworks.map(a => `${a.id}:${a.status}`).join(',')]);

  const refreshReflectionForArtwork = async (artworkId) => {
    try {
      const res = await reflection.getByArtworkId(artworkId);
      const ref = res?.reflection || null;
      setReflectionMap(prev => ({ ...prev, [artworkId]: ref }));
    } catch {
      setReflectionMap(prev => ({ ...prev, [artworkId]: null }));
    }
  };

  const loadAllReflections = async () => {
    setLoadingReflections(true);
    const map = {};
    await Promise.all(
      artworks.map(async (art) => {
        try {
          const res = await reflection.getByArtworkId(art.id);
          map[art.id] = res?.reflection || null;
        } catch {
          map[art.id] = null;
        }
      })
    );
    setReflectionMap(map);
    setLoadingReflections(false);
  };

  // Opens the confirmation modal — does NOT delete yet
  const handleDeleteRequest = (id) => {
    setDeleteTarget(id);
  };

  // Called when user confirms inside the modal
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await artwork.deleteMine(deleteTarget);
      setDeleteTarget(null);
      if (onArtworkDeleted) onArtworkDeleted();
    } catch (err) {
      setDeleteTarget(null);
      // Surface error without alert() — log for now; could be a toast
      console.error('Delete failed:', err.message || err);
    } finally {
      setDeleting(false);
    }
  };

  // Called when user cancels or dismisses the modal
  const handleDeleteCancel = () => {
    if (deleting) return; // don't close while in-flight
    setDeleteTarget(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return ''; }
  };

  // ── Empty state ──────────────────────────────────────────────
  if (!artworks.length) {
    return (
      <div className="ma-page">
        <div className="pattern-empty">
          <div className="pattern-empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h2 className="pattern-empty-title">Start your collection</h2>
          <p className="pattern-empty-desc">
            Upload your first artwork to begin shaping your identity
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('add-artwork')}>
            Add artwork
          </button>
        </div>
      </div>
    );
  }

  // ── Gallery ──────────────────────────────────────────────────
  return (
    <div className="ma-page">
      <div className="ma-header">
        <p className="ma-sub">
          {artworks.length === 1 ? '1 work' : `${artworks.length} works`}
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('add-artwork')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add artwork
        </button>
      </div>

      {/* M3-16: Collections — private, personal organization only */}
      <div className="ma-collections-bar">
        <div className="ma-collections-pills">
          <button
            className={`ma-collection-pill ${!activeCollectionId ? 'ma-collection-pill--active' : ''}`}
            onClick={() => setActiveCollectionId(null)}
          >
            All
          </button>
          {myCollections.map(c => (
            <button
              key={c.id}
              className={`ma-collection-pill ${activeCollectionId === c.id ? 'ma-collection-pill--active' : ''}`}
              onClick={() => setActiveCollectionId(c.id)}
            >
              {c.name} <span className="ma-collection-pill-count">{c.artwork_count}</span>
            </button>
          ))}
          <input
            type="text"
            className="ma-collection-new-input"
            placeholder="+ New collection"
            value={newCollectionName}
            onChange={e => setNewCollectionName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateCollection(); }}
            disabled={creatingCollection}
          />
        </div>
        <button
          className={`btn btn-secondary btn-sm ${organizing ? 'ma-organize-btn--active' : ''}`}
          onClick={() => { setOrganizing(o => !o); setSelectedIds(new Set()); }}
        >
          {organizing ? 'Done' : 'Organize'}
        </button>
      </div>

      {/* Sort & filter toolbar — client-side over the already-fetched artworks */}
      <div className="ma-filter-bar">
        <div className="ma-filter-controls">
          <div className="ma-filter-group">
            <span className="ma-filter-group-label">Collection</span>
            <div className="ma-filter-chips">
              <button
                type="button"
                className={`pattern-chip ${!activeCollectionId ? 'pattern-chip--active' : ''}`}
                onClick={() => setActiveCollectionId(null)}
              >
                All
              </button>
              {myCollections.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`pattern-chip ${activeCollectionId === c.id ? 'pattern-chip--active' : ''}`}
                  onClick={() => setActiveCollectionId(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="ma-filter-group">
            <span className="ma-filter-group-label">Reflection status</span>
            <div className="ma-filter-chips">
              <button
                type="button"
                className={`pattern-chip ${reflectionFilter === 'all' ? 'pattern-chip--active' : ''}`}
                onClick={() => setReflectionFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`pattern-chip ${reflectionFilter === 'interpreted' ? 'pattern-chip--active' : ''}`}
                onClick={() => setReflectionFilter('interpreted')}
              >
                Interpreted
              </button>
              <button
                type="button"
                className={`pattern-chip ${reflectionFilter === 'awaiting' ? 'pattern-chip--active' : ''}`}
                onClick={() => setReflectionFilter('awaiting')}
              >
                Awaiting reflection
              </button>
            </div>
          </div>

          <div className="pattern-field ma-filter-sort">
            <label className="pattern-field-label" htmlFor="ma-sort-select">Sort by</label>
            <select
              id="ma-sort-select"
              className="pattern-field-input"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ma-filter-meta">
          <span className="ma-filter-count">
            {visibleArtworks.length} of {artworks.length} works
          </span>
          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {organizing && (
        <div className="ma-organize-bar">
          <span className="ma-organize-count">
            {selectedIds.size} selected
          </span>
          <select
            className="form-input ma-organize-select"
            value={assignTargetId}
            onChange={e => setAssignTargetId(e.target.value)}
          >
            <option value="">Choose a collection…</option>
            {myCollections.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!assignTargetId || selectedIds.size === 0 || applyingAssignment}
            onClick={handleAddSelectedToCollection}
          >
            Add to collection
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={!assignTargetId || selectedIds.size === 0 || applyingAssignment}
            onClick={handleRemoveSelectedFromCollection}
          >
            Remove from collection
          </button>
        </div>
      )}

      {visibleArtworks.length === 0 ? (
        <div className="pattern-empty">
          <div className="pattern-empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h2 className="pattern-empty-title">No matching artworks</h2>
          <p className="pattern-empty-desc">
            Try adjusting your sort and filter selections to see more of your collection
          </p>
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
      <div className="ma-grid">
        {visibleArtworks.map((art) => {
          // ── Processing card ──────────────────────────────────
          if (art.status === 'processing') {
            return (
              <div key={art.id} className="ma-card ma-card--processing">
                <div className="ma-card-img-wrap">
                  {art.image_url ? (
                    <ArtworkCardImage
                      src={art.image_url}
                      alt={art.title || 'Artwork'}
                      artworkType={art.artwork_type}
                    />
                  ) : (
                    <div className="ma-card-img ma-card-img--placeholder">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  {/* Processing overlay */}
                  <div className="ma-processing-overlay">
                    <div className="ma-processing-spinner" />
                    <span className="ma-processing-label">Generating reflection…</span>
                  </div>
                </div>
                <div className="ma-card-body">
                  <div className="ma-card-top">
                    <h3 className="ma-card-title">{art.title || 'Untitled'}</h3>
                    <span className="ma-card-dot ma-card-dot--processing" title="Processing" />
                  </div>
                  <p className="ma-card-date ma-card-date--processing">Analyzing artwork…</p>
                </div>
              </div>
            );
          }

          // ── Normal card ──────────────────────────────────────
          const hasReflection = !!reflectionMap[art.id];
          const reflectionChecked = art.id in reflectionMap;

          return (
            <div key={art.id} className={`ma-card ${organizing && selectedIds.has(art.id) ? 'ma-card--selected' : ''}`}>
              {/* Image — main focus */}
              <div className="ma-card-img-wrap">
                <ArtworkCardImage
                  src={art.image_url}
                  alt={art.title || 'Artwork'}
                  artworkType={art.artwork_type}
                />
                {organizing && (
                  <label className="ma-card-select" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(art.id)}
                      onChange={() => toggleSelected(art.id)}
                    />
                  </label>
                )}
                {/* Hover overlay with actions */}
                <div className="ma-card-overlay">
                  <button
                    className="ma-overlay-btn ma-overlay-btn--primary"
                    onClick={() => onNavigate('reflection', art.id)}
                  >
                    {hasReflection ? 'View Reflection' : 'Generate Reflection'}
                  </button>
                  <button
                    className="ma-overlay-btn ma-overlay-btn--danger"
                    onClick={() => handleDeleteRequest(art.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Info below image */}
              <div className="ma-card-body">
                <div className="ma-card-top">
                  <h3 className="ma-card-title">{art.title || 'Untitled'}</h3>
                  {reflectionChecked && (
                    <span className={`ma-card-dot ${hasReflection ? 'ma-card-dot--on' : 'ma-card-dot--off'}`}
                      title={hasReflection ? 'Reflection ready' : 'No reflection yet'}
                    />
                  )}
                </div>
                <p className="ma-card-date">{formatDate(art.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete artwork?"
        message="This action cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        danger
      />
    </div>
  );
};

export default MyArtwork;
