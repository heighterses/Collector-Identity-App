import { useState, useEffect } from 'react';
import { identity, comparison } from '../api.js';

const SimilarityRing = ({ score }) => {
  const pct = Math.round(score * 100);
  const r = 36, cx = 44, cy = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={88} height={88}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={6} />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={pct > 80 ? 'var(--success)' : pct > 50 ? 'var(--accent)' : 'var(--error)'}
          strokeWidth={6} strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy + 5} textAnchor="middle"
          style={{ fontSize: 15, fontWeight: 600, fill: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
          {pct}%
        </text>
      </svg>
      <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', marginTop: 4 }}>Similarity</p>
    </div>
  );
};

const TraitColumn = ({ title, traits, color, bg }) => (
  <div style={{ flex: 1 }}>
    <p style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '0.08em', color, marginBottom: 8 }}>{title} ({traits.length})</p>
    {traits.length === 0
      ? <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-300)' }}>—</p>
      : traits.map((t, i) => (
        <div key={i} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 6, padding: '4px 10px', marginBottom: 4, fontSize: 'var(--text-xs)', color }}>
          {t}
        </div>
      ))
    }
  </div>
);

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

  const selectStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid var(--line)',
    borderRadius: 8, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
    color: 'var(--ink)', background: 'var(--white)', outline: 'none', cursor: 'pointer',
  };

  const labelStyle = {
    display: 'block', fontSize: 'var(--text-xs)', color: 'var(--gray-500)',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em',
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ padding: '28px 0 24px' }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>M3-14</p>
        <h1 style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-serif)', color: 'var(--ink)', margin: 0 }}>Compare Identity Versions</h1>
      </div>

      {/* Controls */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>

        {templates.length === 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-400)', textAlign: 'center', padding: '12px 0' }}>
            No identity profiles yet. Upload artwork and generate a reflection first.
          </p>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Select artwork</label>
              <select style={selectStyle} value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                <option value="">— Choose an artwork —</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    Artwork identity v{t.version} — {new Date(t.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {fetchingVersions && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Loading versions…</p>
            )}

            {versions.length > 0 && (
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Version A</label>
                  <select style={selectStyle} value={versionA} onChange={e => setVersionA(e.target.value)}>
                    <option value="">— Pick version —</option>
                    {versions.map(v => (
                      <option key={v.id} value={v.id}>Version {v.version_number} — {new Date(v.created_at).toLocaleDateString()}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Version B</label>
                  <select style={selectStyle} value={versionB} onChange={e => setVersionB(e.target.value)}>
                    <option value="">— Pick version —</option>
                    {versions.filter(v => v.id !== versionA).map(v => (
                      <option key={v.id} value={v.id}>Version {v.version_number} — {new Date(v.created_at).toLocaleDateString()}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {versions.length === 1 && !fetchingVersions && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 12 }}>
                Only 1 saved version exists. Save at least 2 versions from the Identity page to compare.
              </p>
            )}

            {versions.length === 0 && selectedTemplate && !fetchingVersions && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 12 }}>
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

      {error && (
        <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 'var(--text-sm)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary + similarity */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Summary</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink)', lineHeight: 'var(--leading-normal)' }}>{result.summary}</p>
              <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                <div><span style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>{result.shared_traits?.length}</span><br /><span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)' }}>Shared</span></div>
                <div><span style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-serif)', color: 'var(--success)' }}>{result.added_traits?.length}</span><br /><span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)' }}>Added</span></div>
                <div><span style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-serif)', color: 'var(--error)' }}>{result.removed_traits?.length}</span><br /><span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)' }}>Removed</span></div>
              </div>
            </div>
            <SimilarityRing score={result.similarity_score ?? 0} />
          </div>

          {/* Core identity side by side */}
          {(result.version_a?.core_identity || result.version_b?.core_identity) && (
            <div style={{ display: 'flex', gap: 12 }}>
              {[result.version_a, result.version_b].map((v, i) => v?.core_identity && (
                <div key={i} style={{ flex: 1, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Version {v.version_number} — Core</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink)', lineHeight: 'var(--leading-normal)', fontStyle: 'italic' }}>"{v.core_identity}"</p>
                </div>
              ))}
            </div>
          )}

          {/* Trait diff */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trait Breakdown</p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <TraitColumn title="Shared" traits={result.shared_traits || []} color="var(--ink-muted)" bg="var(--paper-2)" />
              <TraitColumn title="Added (new in B)" traits={result.added_traits || []} color="var(--success)" bg="var(--success-bg)" />
              <TraitColumn title="Removed (lost in B)" traits={result.removed_traits || []} color="var(--error)" bg="var(--error-bg)" />
            </div>
          </div>

          {/* Value changes */}
          {result.value_changes?.length > 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 24px' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Intensity Changes</p>
              {result.value_changes.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < result.value_changes.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{c.trait}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', background: 'var(--paper-2)', borderRadius: 4, padding: '2px 8px' }}>{c.from}</span>
                  <span style={{ color: 'var(--gray-300)' }}>→</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', background: 'var(--accent-light)', borderRadius: 4, padding: '2px 8px' }}>{c.to}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
