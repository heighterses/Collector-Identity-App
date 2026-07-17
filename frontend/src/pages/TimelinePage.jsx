import { useState, useEffect } from 'react';
import { timeline } from '../api.js';

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
