import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { timeline, identityNotes } from '../api.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const NOTE_MAX = 280;

// Same palette ProfilePieCharts.jsx uses, for visual consistency across
// the app's charts.
const TRAIT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

// M3-18: trait intensity per version — reuses identity_change_detector's
// output as-is (intensity_series), no recomputation on the frontend.
// Hovering/clicking a version point reveals that version's key traits,
// pulled from the already-fetched timeline events (traits_snapshot) rather
// than a second API call.
const IntensityChart = ({ intensitySeries, analysisEvents }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const { versions = [], series = [] } = intensitySeries || {};

  if (!series.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-400)' }}>
        <p style={{ fontSize: 'var(--text-sm)' }}>
          Add more artworks with confirmed trait intensities to see how they've shifted over time.
        </p>
      </div>
    );
  }

  const data = {
    labels: versions.map(v => `v${v}`),
    datasets: series.map((s, i) => ({
      label: s.trait,
      data: s.values,
      borderColor: TRAIT_COLORS[i % TRAIT_COLORS.length],
      backgroundColor: TRAIT_COLORS[i % TRAIT_COLORS.length],
      spanGaps: true,
      tension: 0.25,
      pointRadius: 4,
      pointHoverRadius: 6,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick: (_evt, elements) => {
      if (elements?.length) setSelectedIndex(elements[0].index);
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterBody: (items) => {
            const idx = items[0]?.dataIndex;
            const ev = analysisEvents[idx];
            return ev ? ['', 'Click point to see full traits'] : [];
          },
        },
      },
    },
    scales: {
      y: { title: { display: true, text: 'Intensity (0–10)' }, min: 0, suggestedMax: 10 },
      x: { title: { display: true, text: 'Identity version' } },
    },
  };

  const selectedEvent = selectedIndex != null ? analysisEvents[selectedIndex] : null;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
        {series.map((s, i) => (
          <span key={s.trait} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: TRAIT_COLORS[i % TRAIT_COLORS.length], display: 'inline-block' }} />
            {s.trait}
          </span>
        ))}
      </div>

      <div style={{ position: 'relative', height: 260 }}>
        <Line
          data={data}
          options={options}
          role="img"
          aria-label={`Line chart of trait intensity across ${versions.length} identity versions: ${series.map(s => s.trait).join(', ')}`}
        />
      </div>

      {selectedEvent && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            v{versions[selectedIndex]} · {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </p>
          {selectedEvent.traits_snapshot?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedEvent.traits_snapshot.map((t, i) => <TraitPill key={i} label={t} />)}
            </div>
          ) : (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>No confirmed traits recorded for this version.</p>
          )}
        </div>
      )}
    </div>
  );
};

// A short personal annotation on a saved identity version — deliberately
// styled as a sticky-note aside, never as a trait pill, so it can never be
// mistaken for a confirmed identity signal. Create + delete only, no edit.
const VersionNotes = ({ versionId }) => {
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    identityNotes.getForVersion(versionId)
      .then(data => setNotes(data.notes || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [versionId]);

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text || text.length > NOTE_MAX || saving) return;
    setSaving(true);
    try {
      const res = await identityNotes.add(versionId, text);
      if (res?.note) {
        setNotes(prev => [...prev, res.note]);
        setDraft('');
      }
    } catch {
      // silent — the draft stays in the input so the user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try {
      await identityNotes.remove(noteId);
    } catch {
      // note is already gone from the UI; a stale row on the server isn't
      // worth re-inserting the note and confusing the user
    }
  };

  if (!loaded) return null;

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
      {notes.map(note => (
        <div key={note.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 6,
          marginBottom: 6, fontSize: 'var(--text-xs)', color: 'var(--gray-500)',
        }}>
          <span style={{ fontStyle: 'italic', flex: 1 }}>&ldquo;{note.note_text}&rdquo;</span>
          <button
            onClick={() => handleDelete(note.id)}
            aria-label="Delete note"
            style={{
              background: 'none', border: 'none', color: 'var(--gray-400)',
              cursor: 'pointer', fontSize: 'var(--text-xs)', padding: '0 2px', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, NOTE_MAX))}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Add a note about this moment…"
          maxLength={NOTE_MAX}
          disabled={saving}
          style={{
            flex: 1, fontSize: 'var(--text-xs)', padding: '5px 8px',
            border: '1px solid var(--line)', borderRadius: 6,
            background: 'var(--paper-2)', color: 'var(--ink)', outline: 'none',
          }}
        />
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
          {draft.length}/{NOTE_MAX}
        </span>
        <button
          onClick={handleAdd}
          disabled={!draft.trim() || saving}
          style={{
            fontSize: 'var(--text-2xs)', padding: '5px 10px', borderRadius: 6,
            border: 'none', cursor: draft.trim() ? 'pointer' : 'not-allowed',
            background: draft.trim() ? 'var(--ink)' : 'var(--line)',
            color: draft.trim() ? 'var(--white)' : 'var(--gray-400)',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

const ChangeBar = ({ score }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>Change</span>
    <div style={{ flex: 1, height: 3, background: 'var(--line)', borderRadius: 2 }}>
      <div style={{
        width: `${Math.round(score * 100)}%`, height: '100%',
        background: score > 0.6 ? 'var(--error)' : score > 0.3 ? 'var(--accent)' : 'var(--success)',
        borderRadius: 2, transition: 'width 0.6s ease',
      }} />
    </div>
    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
      {Math.round(score * 100)}%
    </span>
  </div>
);

const TraitPill = ({ label }) => (
  <span style={{
    display: 'inline-block', background: 'var(--accent-subtle)',
    border: '1px solid rgba(181,129,58,0.2)',
    borderRadius: 20, padding: '2px 10px',
    fontSize: 'var(--text-2xs)', color: 'var(--accent)',
    marginRight: 4, marginBottom: 4,
  }}>{label}</span>
);

const EventCard = ({ event, isLast }) => {
  const isSaved = event.event_type === 'saved_version';
  return (
    <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
      {/* Spine */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
          background: isSaved ? 'var(--accent)' : 'var(--ink)',
          border: `2px solid ${isSaved ? 'var(--accent)' : 'var(--ink)'}`,
          marginTop: 4, zIndex: 1,
        }} />
        {!isLast && (
          <div style={{ width: 1, flex: 1, background: 'var(--line)', marginTop: 4 }} />
        )}
      </div>

      {/* Card */}
      <div style={{
        flex: 1, background: 'var(--white)', border: '1px solid var(--line)',
        borderRadius: 10, padding: '14px 16px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <p style={{ fontSize: 'var(--text-2xs)', color: isSaved ? 'var(--accent)' : 'var(--gray-400)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isSaved ? 'Saved snapshot' : 'Artwork analysis'}
            </p>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--ink)', margin: 0 }}>
              {event.title}
            </p>
          </div>
          {event.date && (
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {event.summary && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: 8, lineHeight: 'var(--leading-normal)' }}>
            {event.summary}
          </p>
        )}

        {event.traits_snapshot?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {event.traits_snapshot.map((t, i) => <TraitPill key={i} label={t} />)}
          </div>
        )}

        {event.change_score > 0 && <ChangeBar score={event.change_score} />}

        {/* M3-15: notes only apply to real saved IdentityVersion rows —
            "artwork_analysis" events aren't backed by one, so there's
            nothing valid to attach a note to. */}
        {isSaved && event.id && <VersionNotes versionId={event.id} />}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub }) => (
  <div style={{
    background: 'var(--white)', border: '1px solid var(--line)',
    borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 120,
  }}>
    <p style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-serif)', color: 'var(--ink)', margin: '0 0 4px' }}>{value}</p>
    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', margin: 0 }}>{label}</p>
    {sub && <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--accent)', marginTop: 4 }}>{sub}</p>}
  </div>
);

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [changes, setChanges] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    Promise.all([timeline.get(), timeline.getChanges()])
      .then(([tl, ch]) => {
        setEvents(tl.events || []);
        setSummary(tl.summary || {});
        setChanges(ch);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner" />
    </div>
  );

  const tabStyle = (tab) => ({
    padding: '8px 18px', border: 'none', borderRadius: 20, cursor: 'pointer',
    fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)',
    background: activeTab === tab ? 'var(--ink)' : 'transparent',
    color: activeTab === tab ? 'var(--white)' : 'var(--gray-500)',
    transition: 'all 0.15s',
  });

  // artwork_analysis events are built from the same identity_templates list,
  // in the same order, as intensity_series.versions — used to look up each
  // version's key traits for the chart's click/hover reveal.
  const analysisEvents = events.filter(e => e.event_type === 'artwork_analysis');

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ padding: '28px 0 20px' }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Identity Evolution</p>
        <h1 style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-serif)', color: 'var(--ink)', margin: '0 0 16px' }}>Timeline</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2)', borderRadius: 24, padding: 4, width: 'fit-content' }}>
          <button style={tabStyle('timeline')} onClick={() => setActiveTab('timeline')}>Timeline</button>
          <button style={tabStyle('changes')} onClick={() => setActiveTab('changes')}>Trait Changes</button>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-400)' }}>
          <p style={{ fontSize: 'var(--text-md)', marginBottom: 8 }}>No timeline yet</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>Upload artwork and generate reflections to build your identity timeline.</p>
        </div>
      ) : activeTab === 'timeline' ? (
        <>
          {/* Stats row */}
          {summary && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
              <StatCard label="Total events" value={summary.total_events ?? 0} />
              <StatCard label="Identity shifts" value={summary.identity_shifts ?? 0} />
              {summary.most_stable_trait && (
                <StatCard label="Most stable trait" value={summary.most_stable_trait} />
              )}
            </div>
          )}

          {/* M3-18: trait intensity over time */}
          {changes && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 20px', marginBottom: 28 }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Trait Intensity Over Time
              </p>
              <IntensityChart intensitySeries={changes.intensity_series} analysisEvents={analysisEvents} />
            </div>
          )}

          {/* Timeline */}
          <div>
            {events.map((event, i) => (
              <EventCard key={i} event={event} isLast={i === events.length - 1} />
            ))}
          </div>
        </>
      ) : (
        /* Changes tab */
        changes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Volatility */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 20px' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Identity Volatility</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--line)', borderRadius: 3 }}>
                  <div style={{
                    width: `${Math.round((changes.volatility_score || 0) * 100)}%`,
                    height: '100%', borderRadius: 3,
                    background: (changes.volatility_score || 0) > 0.6 ? 'var(--error)' : 'var(--accent)',
                  }} />
                </div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                  {Math.round((changes.volatility_score || 0) * 100)}%
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginTop: 8 }}>{changes.summary}</p>
            </div>

            {[
              { key: 'stable_traits', label: 'Stable Traits', color: 'var(--success)', bg: 'var(--success-bg)' },
              { key: 'emerging_traits', label: 'Emerging Traits', color: 'var(--accent)', bg: 'var(--accent-light)' },
              { key: 'fading_traits', label: 'Fading Traits', color: 'var(--gray-500)', bg: 'var(--paper-2)' },
            ].map(({ key, label, color, bg }) => changes[key]?.length > 0 && (
              <div key={key} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 20px' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {changes[key].map((t, i) => (
                    <span key={i} style={{ background: bg, color, border: `1px solid ${color}22`, borderRadius: 20, padding: '3px 12px', fontSize: 'var(--text-xs)' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}

            {changes.intensity_trends?.length > 0 && (
              <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 20px' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Intensity Trends</p>
                {changes.intensity_trends.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < changes.intensity_trends.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{t.trait}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: t.direction === 'increasing' ? 'var(--success)' : 'var(--error)' }}>
                        {t.direction === 'increasing' ? '↑' : '↓'} {Math.abs(t.delta).toFixed(2)}
                      </span>
                      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)' }}>avg {t.avg}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
            <p>Upload more artworks to see trait changes over time.</p>
          </div>
        )
      )}
    </div>
  );
}
