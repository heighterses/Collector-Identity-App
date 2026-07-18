import { useState, useEffect } from 'react';
import { identity, comparison } from '../api.js';

// Single-accent proportion ring — no success/error thresholds, since the
// app has no traffic-light semantics; similarity is just similarity.
const SimilarityRing = ({ score }) => {
  const pct = Math.round(score * 100);
  const r = 36, cx = 44, cy = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={88} height={88}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={6} />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--accent)"
          strokeWidth={6} strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy + 5} textAnchor="middle"
          style={{ fontSize: 15, fontWeight: 600, fill: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
          {pct}%
        </text>
      </svg>
      <p className="pattern-eyebrow" style={{ marginTop: 6, marginBottom: 0 }}>Similarity</p>
    </div>
  );
};

// Added/removed distinguished by filled vs. outline + a +/− prefix, not
// color — the single-accent palette has no green/red to spend on this.
const TraitColumn = ({ title, traits, variant }) => {
  const prefix = variant === 'added' ? '+' : variant === 'removed' ? '−' : null;
  const chipClass = variant === 'added'
    ? 'pattern-chip pattern-chip--active'
    : variant === 'removed'
      ? 'pattern-chip pattern-chip--outline'
      : 'pattern-chip';
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <p className="pattern-eyebrow">{title} ({traits.length})</p>
      {traits.length === 0
        ? <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>—</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
            {traits.map((t, i) => (
              <span key={i} className={chipClass}>
                {prefix && <span className="pattern-chip-prefix">{prefix}</span>}
                {t}
              </span>
            ))}
          </div>
        )
      }
    </div>
  );
};

export default function ComparisonPage() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [versions, setVersions] = useState([]);
  const [versionA, setVersionA] = useState('');
  const [versionB, setVersionB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingVersions, setFetchingVersions] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    identity.getProfileData()
      .then(data => setTemplates(data.identities || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTemplate) return;
    setFetchingVersions(true);
    setVersions([]);
    setVersionA('');
    setVersionB('');
    setResult(null);
    comparison.listVersions(selectedTemplate)
      .then(data => setVersions(data.versions || []))
      .catch(() => setVersions([]))
      .finally(() => setFetchingVersions(false));
  }, [selectedTemplate]);

  const handleCompare = async () => {
    if (!versionA || !versionB) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await comparison.compareVersions(versionA, versionB);
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-page">

      {/* Controls */}
      <div className="card cp-panel">

        {templates.length === 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-faint)', textAlign: 'center', padding: '12px 0' }}>
            No identity profiles yet. Upload artwork and generate a reflection first.
          </p>
        ) : (
          <>
            <div className="pattern-field">
              <label className="pattern-field-label">Select artwork</label>
              <select className="settings-select cp-select" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                <option value="">— Choose an artwork —</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    Artwork identity v{t.version} — {new Date(t.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {fetchingVersions && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>Loading versions…</p>
            )}

            {versions.length > 0 && (
              <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
                <div className="pattern-field" style={{ flex: 1 }}>
                  <label className="pattern-field-label">Version A</label>
                  <select className="settings-select cp-select" value={versionA} onChange={e => setVersionA(e.target.value)}>
                    <option value="">— Pick version —</option>
                    {versions.map(v => (
                      <option key={v.id} value={v.id}>Version {v.version_number} — {new Date(v.created_at).toLocaleDateString()}</option>
                    ))}
                  </select>
                </div>
                <div className="pattern-field" style={{ flex: 1 }}>
                  <label className="pattern-field-label">Version B</label>
                  <select className="settings-select cp-select" value={versionB} onChange={e => setVersionB(e.target.value)}>
                    <option value="">— Pick version —</option>
                    {versions.filter(v => v.id !== versionA).map(v => (
                      <option key={v.id} value={v.id}>Version {v.version_number} — {new Date(v.created_at).toLocaleDateString()}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {versions.length === 1 && !fetchingVersions && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginBottom: 12 }}>
                Only 1 saved version exists. Save at least 2 versions from the Identity page to compare.
              </p>
            )}

            {versions.length === 0 && selectedTemplate && !fetchingVersions && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginBottom: 12 }}>
                No saved versions for this artwork yet. Use "Save version" on the Identity page first.
              </p>
            )}

            <button
              onClick={handleCompare}
              disabled={!versionA || !versionB || loading}
              className="btn btn-primary"
              style={{ marginTop: 4 }}
            >
              {loading ? 'Comparing…' : 'Compare versions'}
            </button>
          </>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary + similarity */}
          <div className="card cp-panel cp-summary">
            <div>
              <p className="pattern-eyebrow">Summary</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 'var(--leading-normal)' }}>{result.summary}</p>
              <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                <div>
                  <span style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{result.shared_traits?.length}</span>
                  <br /><span className="pattern-eyebrow" style={{ marginBottom: 0 }}>Shared</span>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>+{result.added_traits?.length}</span>
                  <br /><span className="pattern-eyebrow" style={{ marginBottom: 0 }}>Added</span>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>&minus;{result.removed_traits?.length}</span>
                  <br /><span className="pattern-eyebrow" style={{ marginBottom: 0 }}>Removed</span>
                </div>
              </div>
            </div>
            <SimilarityRing score={result.similarity_score ?? 0} />
          </div>

          {/* Core identity side by side */}
          {(result.version_a?.core_identity || result.version_b?.core_identity) && (
            <div style={{ display: 'flex', gap: 12 }}>
              {[result.version_a, result.version_b].map((v, i) => v?.core_identity && (
                <div key={i} className="card" style={{ flex: 1, background: 'var(--paper-2)', padding: '14px 16px' }}>
                  <p className="pattern-eyebrow">Version {v.version_number} — Core</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 'var(--leading-normal)', fontStyle: 'italic' }}>"{v.core_identity}"</p>
                </div>
              ))}
            </div>
          )}

          {/* Trait diff */}
          <div className="card cp-panel">
            <p className="pattern-eyebrow" style={{ marginBottom: 16 }}>Trait breakdown</p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <TraitColumn title="Shared" traits={result.shared_traits || []} variant="shared" />
              <TraitColumn title="Added in B" traits={result.added_traits || []} variant="added" />
              <TraitColumn title="Removed in B" traits={result.removed_traits || []} variant="removed" />
            </div>
          </div>

          {/* Value changes */}
          {result.value_changes?.length > 0 && (
            <div className="card cp-panel">
              <p className="pattern-eyebrow" style={{ marginBottom: 12 }}>Intensity changes</p>
              {result.value_changes.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < result.value_changes.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{c.trait}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', background: 'var(--paper-2)', borderRadius: 4, padding: '2px 8px' }}>{c.from}</span>
                  <span style={{ color: 'var(--text-faint)' }}>→</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-hover)', background: 'var(--accent-light)', borderRadius: 4, padding: '2px 8px' }}>{c.to}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
