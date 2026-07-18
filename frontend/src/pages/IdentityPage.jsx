import { useEffect, useState, useRef, useCallback } from "react";
import Snackbar from "../components/identity/Snackbar";
import { artwork as artworkApi, identity as identityApi } from "../api.js";

/** Triggers a browser download of the given object as a formatted JSON file. */
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Split flat traits array into logical groups.
 *  The API serialises the field as "type" (not "trait_type"). */
function groupTraits(traits) {
  const core    = traits.find(t => (t.type || t.trait_type) === "text" && t.label === "Core Identity");
  const chips   = traits.filter(t => (t.type || t.trait_type) === "chip");
  const sliders = traits.filter(t => (t.type || t.trait_type) === "slider");
  return { core, chips, sliders };
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Header: eyebrow / title / subtitle / save & export actions */
function HeaderCard({ artwork, onSave, saving, onExport, exporting }) {
  return (
    <div className="card idn-header">
      <div>
        <p className="pattern-eyebrow pattern-eyebrow--accent">Analysis</p>
        <h1 className="pattern-title">Your identity</h1>
        {artwork && (
          <p className="idn-header-sub">Based on &ldquo;{artwork.title}&rdquo;</p>
        )}
      </div>
      <div className="idn-header-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onExport}
          disabled={exporting}
          title="Download a clean JSON snapshot of your current identity to keep or share"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {exporting ? "Exporting…" : "Export summary"}
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={onSave}
          disabled={saving}
          title="Save a snapshot of your current identity"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          {saving ? "Saving…" : "Save version"}
        </button>
      </div>
    </div>
  );
}

/** Hero pull-quote — the core identity statement, plain (no card border),
 *  matching the design's "Through-Line" section. */
function CoreStatementCard({ core }) {
  if (!core) return null;
  return (
    <section className="idn-hero">
      <p className="pattern-eyebrow pattern-eyebrow--accent pattern-eyebrow--hero">The through-line</p>
      <blockquote className="pattern-quote pattern-quote--hero">&ldquo;{core.value}&rdquo;</blockquote>
    </section>
  );
}

/** Artwork selector — a chip row, real data (not decorative), styled like
 *  the design's identity-art chip row. Only shown with multiple artworks. */
function ArtworkTabs({ artworks, activeId, onSelect }) {
  if (artworks.length <= 1) return null;
  return (
    <div className="idn-tabs">
      {artworks.map(art => (
        <button
          key={art.id}
          className={`pattern-chip ${activeId === art.id ? "pattern-chip--active" : ""}`}
          onClick={() => onSelect(art.id)}
        >
          {art.title}
        </button>
      ))}
    </div>
  );
}

/** Traits & themes — boolean on/off traits as selector chips. No status
 *  badge (the old green "Active" badge is gone); active state is carried
 *  by the filled chip itself. */
function TraitsSection({ chips, onToggle }) {
  if (!chips.length) return null;

  const isChipActive = t => t.value === "true" || t.value === "1.0";
  const active   = chips.filter(t => isChipActive(t));
  const inactive = chips.filter(t => !isChipActive(t));
  const allChips = [...active, ...inactive];

  return (
    <section className="idn-section">
      <div className="idn-section-head">
        <p className="pattern-eyebrow">Traits &amp; themes</p>
        <p className="idn-section-desc">Tap a trait to toggle it on or off</p>
      </div>
      <div className="idn-chip-list">
        {allChips.map(t => {
          const isActive = isChipActive(t);
          return (
            <button
              key={t.id}
              className={`pattern-chip ${isActive ? "pattern-chip--active" : "pattern-chip--outline"}`}
              onClick={() => onToggle(t.id, { value: isActive ? "false" : "1.0" })}
              title={isActive ? "Click to disable" : "Click to enable"}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Metrics — numeric intensity traits as trait cards with a live-draggable
 *  score bar. No expand/description affordance: the API doesn't return
 *  descriptive text for slider traits, so there's nothing to expand into. */
function MetricsSection({ sliders, onUpdate }) {
  if (!sliders.length) return null;

  const sorted = [...sliders]
    .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
    .slice(0, 6);

  const max = 10;

  return (
    <section className="idn-section">
      <div className="idn-section-head">
        <p className="pattern-eyebrow">Metrics</p>
        <p className="idn-section-desc">AI-scored dimensions of your creative identity</p>
      </div>
      <div className="idn-trait-grid">
        {sorted.map(t => {
          const raw   = parseFloat(t.value) || 0;
          const label = t.label.replace(" (ML)", "").replace("(ML)", "").trim();
          return (
            <MetricBar key={t.id} id={t.id} label={label} value={raw} max={max} onUpdate={onUpdate} />
          );
        })}
      </div>
    </section>
  );
}

/** Single interactive trait card — draggable range input overlaid on a
 *  visual score bar, restyled from `.pattern-trait-card`. */
function MetricBar({ id, label, value, max, onUpdate }) {
  const [localVal, setLocalVal] = useState(value);
  const committed = useRef(false);

  useEffect(() => { setLocalVal(value); }, [value]);

  const handleRelease = () => {
    if (committed.current) return;
    committed.current = true;
    setTimeout(() => { committed.current = false; }, 100);
    onUpdate(id, { value: String(localVal) });
  };

  const localPct = Math.min((localVal / max) * 100, 100);

  return (
    <div className="pattern-trait-card idn-metric-card">
      <div className="pattern-trait-card-head">
        <span className="pattern-trait-card-name idn-metric-name">{label}</span>
        <span className="pattern-trait-card-score">
          {localVal.toFixed ? localVal.toFixed(1) : localVal}<span className="idn-metric-max">/{max}</span>
        </span>
      </div>
      <div className="pattern-trait-card-bar-track">
        <div className="pattern-trait-card-bar-fill" style={{ width: `${localPct}%` }} />
      </div>
      <input
        type="range"
        min="0"
        max={max}
        step="0.1"
        value={localVal}
        onChange={e => setLocalVal(parseFloat(e.target.value))}
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}
        className="idn-metric-range"
        aria-label={`Adjust ${label}`}
      />
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="identity-page">
      <div className="card idn-header">
        <div className="ghost-card" style={{ height: 14, width: 60, marginBottom: 10 }} />
        <div className="ghost-card" style={{ height: 32, width: 200, marginBottom: 8 }} />
        <div className="ghost-card" style={{ height: 14, width: 160 }} />
      </div>
      <div className="idn-hero">
        <div className="ghost-card" style={{ height: 52, width: '70%', margin: '0 auto', borderRadius: 10 }} />
      </div>
      <div className="idn-section">
        <div className="ghost-card" style={{ height: 16, width: 120, marginBottom: 16 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[80, 110, 90, 130, 70, 100].map((w, i) => (
            <div key={i} className="ghost-card" style={{ height: 30, width: w, borderRadius: 999 }} />
          ))}
        </div>
      </div>
      <div className="idn-section">
        <div className="ghost-card" style={{ height: 16, width: 80, marginBottom: 16 }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div className="ghost-card" style={{ height: 12, width: 140, marginBottom: 8 }} />
            <div className="ghost-card" style={{ height: 6, borderRadius: 3 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ artworkCount }) {
  return (
    <div className="identity-page">
      <div className="card idn-header">
        <div>
          <p className="pattern-eyebrow pattern-eyebrow--accent">Analysis</p>
          <h1 className="pattern-title">Your identity</h1>
          <p className="idn-header-sub">AI-generated traits derived from your artwork and reflections</p>
        </div>
      </div>
      <div className="pattern-empty">
        <div className="pattern-empty-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h2 className="pattern-empty-title">No identity yet</h2>
        <p className="pattern-empty-desc">
          {artworkCount > 0
            ? `You have ${artworkCount} artwork${artworkCount !== 1 ? "s" : ""} but no identity has been generated. Generate a reflection first.`
            : "Add an artwork and generate a reflection to build your identity profile."}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function IdentityPage({ artworkId }) {
  const [data,            setData]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [activeArtworkId, setActiveArtworkId] = useState(artworkId);
  const [allArtworks,     setAllArtworks]     = useState([]);
  const [showSnackbar,    setShowSnackbar]    = useState(false);
  const [savedAt,         setSavedAt]         = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [exporting,       setExporting]       = useState(false);
  const savingRef = useRef(false);

  // Load artworks list on mount
  useEffect(() => { loadArtworks(); }, []);

  const loadArtworks = async () => {
    try {
      const res  = await artworkApi.getMine();
      const list = res.artworks || [];
      setAllArtworks(list);
      const startId = artworkId || list[0]?.id || null;
      setActiveArtworkId(startId);
    } catch {
      setAllArtworks([]);
      setLoading(false);
    }
  };

  // Fetch template whenever active artwork changes
  useEffect(() => {
    if (!activeArtworkId) { setLoading(false); return; }
    fetchTemplate(activeArtworkId);
  }, [activeArtworkId]);

  const fetchTemplate = async (id) => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    try {
      const res  = await fetch(`/api/identity/template/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json?.traits?.length > 0) {
        setData(json);
        setLoading(false);
        return;
      }

      // Try next artwork
      const idx  = allArtworks.findIndex(a => a.id === id);
      const next = allArtworks[idx + 1];
      if (next) { setActiveArtworkId(next.id); }
      else      { setData(null); setLoading(false); }
    } catch {
      setData(null);
      setLoading(false);
    }
  };

  const handleUpdate = async (traitId, updates) => {
    const token = localStorage.getItem("authToken");
    const res   = await fetch(`/api/identity/trait/${traitId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(prev => ({
        ...prev,
        traits: prev.traits.map(t => t.id === traitId ? { ...t, ...updated } : t),
      }));
    }
  };

  const handleSaveVersion = async () => {
    if (savingRef.current || !data?.template_id) return;
    savingRef.current = true;
    setSaving(true);
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`/api/identity/version/save/${data.template_id}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setShowSnackbar(false);
        setTimeout(() => {
          setSavedAt(result.version?.created_at || new Date().toISOString());
          setShowSnackbar(true);
        }, 10);
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleSnackbarClose = useCallback(() => setShowSnackbar(false), []);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await identityApi.exportSummary();
      const dateStamp = (result.exported_at || new Date().toISOString()).slice(0, 10);
      downloadJson(result, `identity-summary-${dateStamp}.json`);
    } catch (err) {
      console.error("Identity export failed:", err.message || err);
    } finally {
      setExporting(false);
    }
  };

  // ── Render states ────────────────────────────────────────────
  if (loading) return <LoadingSkeleton />;
  if (!data || !data.traits?.length) return <EmptyState artworkCount={allArtworks.length} />;

  const activeArtwork            = allArtworks.find(a => a.id === activeArtworkId);
  const { core, chips, sliders } = groupTraits(data.traits);

  return (
    <div className="identity-page">

      <HeaderCard
        artwork={activeArtwork}
        onSave={handleSaveVersion}
        saving={saving}
        onExport={handleExport}
        exporting={exporting}
      />

      <CoreStatementCard core={core} />

      <ArtworkTabs
        artworks={allArtworks}
        activeId={activeArtworkId}
        onSelect={setActiveArtworkId}
      />

      <TraitsSection chips={chips} onToggle={handleUpdate} />

      <MetricsSection sliders={sliders} onUpdate={handleUpdate} />

      {showSnackbar && (
        <Snackbar
          message="Version saved"
          timestamp={savedAt}
          onClose={handleSnackbarClose}
        />
      )}
    </div>
  );
}

export default IdentityPage;
