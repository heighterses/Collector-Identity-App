import { useState, useEffect, useRef } from 'react';
import { chat, reflection as reflectionApi } from '../api.js';
import AddArtworkPage from './AddArtworkPage.jsx';

const TypingDots = () => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px 14px' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 7, height: 7, borderRadius: '50%',
        background: 'var(--gray-400)',
        display: 'inline-block',
        animation: `chatDotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </div>
);

const UserBubble = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
    <div style={{
      maxWidth: '68%',
      background: 'var(--ink)',
      color: 'var(--white)',
      borderRadius: '18px 18px 4px 18px',
      padding: '10px 16px',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-normal)',
    }}>
      {text}
    </div>
  </div>
);

const AssistantBubble = ({ text, isTyping }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '72%' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'var(--accent-subtle)',
        border: '1px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
        fontSize: 11, color: 'var(--accent)',
        fontFamily: 'var(--font-serif)',
      }}>C</div>
      <div style={{
        background: 'var(--paper-2)',
        border: '1px solid var(--line)',
        borderRadius: '4px 18px 18px 18px',
        padding: isTyping ? '4px 8px' : '10px 16px',
        fontSize: 'var(--text-sm)',
        lineHeight: 'var(--leading-normal)',
        color: 'var(--ink)',
      }}>
        {isTyping ? <TypingDots /> : text}
      </div>
    </div>
  </div>
);

const SystemNote = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 16px' }}>
    <div style={{
      fontSize: 'var(--text-xs)',
      color: 'var(--ink-muted)',
      background: 'var(--paper-2)',
      border: '1px solid var(--line)',
      borderRadius: 20,
      padding: '4px 14px',
    }}>
      {text}
    </div>
  </div>
);

// Inline upload step — the conversation stays mounted above and below this
// card; nothing navigates away, so history and scroll position are untouched.
const UploadStep = ({ onArtworkCreated, onCancel }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
    <div style={{
      width: '100%',
      background: 'var(--white)',
      border: '1px solid var(--line)',
      borderRadius: 16,
      padding: '20px 22px',
      position: 'relative',
    }}>
      <button
        onClick={onCancel}
        aria-label="Cancel"
        style={{
          position: 'absolute', top: 14, right: 14,
          background: 'none', border: 'none', fontSize: 18, lineHeight: 1,
          color: 'var(--ink-muted)', cursor: 'pointer', padding: 4,
        }}
      >
        ×
      </button>
      <AddArtworkPage onArtworkCreated={onArtworkCreated} />
    </div>
  </div>
);

// The actual generated reflection, shown deterministically once the pipeline
// finishes — reuses the same card the Dashboard shows for "Latest Reflection",
// and edit discipline stays intact: this is a read-only preview, "Review &
// edit" is the only path to actually confirm or revise it.
const ReflectionCard = ({ artwork, reflectionData, onReview }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
    <div className="card db-reflection-card" style={{ width: '100%', maxWidth: '88%' }}>
      <div className="db-reflection-card-header">
        <p className="pattern-eyebrow" style={{ marginBottom: 0 }}>Reflection · {artwork.title}</p>
        <button className="db-col-link" onClick={onReview}>Review & edit →</button>
      </div>
      <p className="db-reflection-body">{reflectionData.content}</p>
    </div>
  </div>
);

const AddArtworkAction = ({ onClick }) => (
  <button onClick={onClick} className="pattern-chip pattern-chip--outline">
    <span className="pattern-chip-prefix" aria-hidden="true">+</span> Add another artwork
  </button>
);

const SuggestedPrompt = ({ text, onClick }) => (
  <button onClick={() => onClick(text)} className="pattern-chip">
    {text}
  </button>
);

// Retractable list of saved conversations (identity-level + one per artwork),
// ChatGPT/Claude style. Collapses to a thin rail with just the toggle.
const ChatSidebar = ({ open, onToggle, conversations, activeArtworkId, onSelect }) => (
  <div style={{
    width: open ? 260 : 46,
    flexShrink: 0,
    borderRight: '1px solid var(--line)',
    background: 'var(--paper-2)',
    display: 'flex', flexDirection: 'column',
    transition: 'width 0.2s ease',
    overflow: 'hidden',
    height: '100%',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: open ? 'space-between' : 'center',
      padding: '14px 10px', borderBottom: '1px solid var(--line)', flexShrink: 0,
    }}>
      {open && (
        <span style={{
          fontSize: 'var(--text-xs)', color: 'var(--ink-muted)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>Chats</span>
      )}
      <button
        onClick={onToggle}
        aria-label={open ? 'Collapse chat list' : 'Expand chat list'}
        title={open ? 'Collapse' : 'Expand'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--ink-muted)', fontSize: 16, lineHeight: 1, padding: 4,
        }}
      >
        {open ? '‹' : '☰'}
      </button>
    </div>

    {open && (
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {conversations.length === 0 ? (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', padding: 8 }}>
            No saved chats yet.
          </p>
        ) : conversations.map(c => {
          const isActive = (c.artwork_id ?? null) === (activeArtworkId ?? null);
          return (
            <button
              key={c.artwork_id || '__identity__'}
              onClick={() => onSelect(c.artwork_id ?? null)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                borderRadius: 10, padding: '8px 10px', marginBottom: 4,
              }}
            >
              <span style={{
                display: 'block', fontSize: 'var(--text-sm)', color: 'var(--ink)',
                fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{c.title}</span>
              {c.preview && (
                <span style={{
                  display: 'block', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2,
                }}>{c.preview}</span>
              )}
            </button>
          );
        })}
      </div>
    )}
  </div>
);

// Chat history is paginated in pages of this size (mirrors the backend
// default in app/routes/chat.py).
const HISTORY_PAGE_SIZE = 50;

export default function ChatPage({ artworks = [], onArtworkCreated, onNavigate, initialArtworkId = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([
    "What does my art say about me?",
    "Which of my traits surprised you most?",
    "How has my identity changed over time?",
    "What should I create next?",
  ]);
  const [hasIdentity, setHasIdentity] = useState(true);
  const [activeArtworkId, setActiveArtworkId] = useState(null);
  const [pendingArtworkId, setPendingArtworkId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const bottomRef = useRef(null);
  const historyLoadedRef = useRef(false);
  // Set once the user explicitly picks a thread from the sidebar, so the
  // "default to the first artwork" effect below never overrides their choice
  // (important for the identity-level thread, whose id is null).
  const userSelectedRef = useRef(false);

  const hasOpenUploadStep = messages.some(m => m.role === 'upload-step');

  const activeArtwork = artworks.find(a => a.id === activeArtworkId) || null;

  // Default the active context to the most recent artwork once one exists —
  // used e.g. right after an inline upload switches the conversation to the
  // artwork that was just added.
  useEffect(() => {
    if (userSelectedRef.current) return;
    if (!activeArtworkId && artworks.length > 0) {
      setActiveArtworkId(artworks[0].id);
    }
  }, [artworks, activeArtworkId]);

  // The greeting shown when a context (an artwork, or the identity-level
  // thread) has no prior conversation yet.
  const showGreeting = async () => {
    try {
      const data = await chat.getContext();
      setHasIdentity(data.has_identity);
      setMessages([{
        role: 'assistant',
        text: data.has_identity
          ? "Hello! I've been looking at your identity profile. What would you like to explore about yourself today?"
          : "Welcome! Upload your first artwork and generate a reflection to start exploring your creative identity.",
      }]);
    } catch {
      setMessages([{
        role: 'assistant',
        text: "Welcome! I'm here to help you explore your creative identity through your artwork.",
      }]);
    }
  };

  // Refresh the sidebar thread list (non-fatal on failure).
  const loadConversations = async () => {
    try {
      const res = await chat.getConversations();
      setConversations(res?.conversations || []);
    } catch {
      /* leave the current list as-is */
    }
  };

  // Load a single thread's persisted history (or a greeting if it's empty).
  const loadThread = async (artworkId) => {
    setHistoryLoading(true);
    setHasMoreHistory(false);
    try {
      const res = await chat.getHistory(artworkId, { limit: HISTORY_PAGE_SIZE });
      const persisted = (res?.messages || []).map(m => ({
        role: m.role, text: m.content, created_at: m.created_at,
      }));
      if (persisted.length > 0) {
        setMessages(persisted);
        setHasMoreHistory(!!res.has_more);
      } else {
        await showGreeting();
      }
    } catch {
      await showGreeting();
    } finally {
      setHistoryLoading(false);
    }
  };

  // Switch the active conversation from the sidebar. artworkId === null is the
  // identity-level thread.
  const switchThread = async (artworkId) => {
    const target = artworkId ?? null;
    if (target === (activeArtworkId ?? null)) return;
    userSelectedRef.current = true;
    setActiveArtworkId(target);
    setSuggestedPrompts([]);
    await loadThread(target);
  };

  // Fix (P1): chat history now persists server-side, scoped per user and per
  // context (a specific artwork, or the identity-level thread). Loaded once
  // on mount so a return visit, a full refresh, or a fresh login after
  // logout all restore the same conversation in order — instead of always
  // starting from a blank greeting.
  useEffect(() => {
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    const contextArtworkId = initialArtworkId || artworks[0]?.id || null;
    setActiveArtworkId(contextArtworkId);

    loadConversations();
    loadThread(contextArtworkId);
    // Runs once on mount only — switching the active artwork afterward
    // (e.g. after an inline upload) intentionally keeps the same visible
    // thread going, matching the pre-existing behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Load earlier messages" — fetches the page immediately before the
  // oldest message currently shown, for threads too long to load at once.
  const loadEarlierMessages = async () => {
    if (loadingMoreHistory || !hasMoreHistory) return;
    const oldest = messages.find(m => m.created_at);
    if (!oldest) return;
    setLoadingMoreHistory(true);
    try {
      const res = await chat.getHistory(activeArtworkId, {
        limit: HISTORY_PAGE_SIZE,
        before: oldest.created_at,
      });
      const older = (res?.messages || []).map(m => ({
        role: m.role, text: m.content, created_at: m.created_at,
      }));
      setMessages(prev => [...older, ...prev]);
      setHasMoreHistory(!!res?.has_more);
    } catch {
      // Leave state as-is — the button stays visible so the user can retry.
    } finally {
      setLoadingMoreHistory(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // `display: 'system'` renders the outgoing turn as a muted note instead of a
  // user bubble — used for the auto-acknowledgment after a new artwork finishes
  // processing, so it doesn't read as if the user typed it themselves.
  const sendMessage = async (text, { display } = {}) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed, ...(display ? { display } : {}) };
    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.text }));

    setMessages(prev => [...prev, userMsg]);
    if (!display) setInput('');
    setSuggestedPrompts([]);
    setLoading(true);

    try {
      const res = await chat.sendMessage(trimmed, history, activeArtworkId);
      setMessages(prev => [...prev, { role: 'assistant', text: res.response }]);
      if (res.suggested_prompts?.length) setSuggestedPrompts(res.suggested_prompts);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "I'm having trouble connecting right now. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
      // Keep the sidebar's previews/ordering current after each turn.
      loadConversations();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Once the artwork we're waiting on finishes processing, pull its reflection
  // into the thread (the actual generated pipeline output, not a paraphrase),
  // make it the active context, and let the assistant react to it.
  useEffect(() => {
    if (!pendingArtworkId) return;
    const art = artworks.find(a => a.id === pendingArtworkId);
    if (!art || art.status === 'processing') return;

    setPendingArtworkId(null);
    setActiveArtworkId(art.id);

    (async () => {
      try {
        const res = await reflectionApi.getByArtworkId(art.id);
        if (res?.reflection) {
          setMessages(prev => [...prev, { role: 'reflection', artwork: art, reflection: res.reflection }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'note',
            text: `Couldn't generate a reflection for "${art.title}" right now — you can try again from My Artwork.`,
          }]);
        }
      } catch {
        setMessages(prev => [...prev, {
          role: 'note',
          text: `Couldn't generate a reflection for "${art.title}" right now — you can try again from My Artwork.`,
        }]);
      }
      sendMessage(
        `I just added a new artwork called "${art.title}". What do you notice about it?`,
        { display: 'system' }
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworks, pendingArtworkId]);

  const handleArtworkUploaded = (newArtwork) => {
    setMessages(prev => [
      ...prev.filter(m => m.role !== 'upload-step'),
      { role: 'note', text: `Added "${newArtwork.title}" — generating a reflection…` },
    ]);
    setPendingArtworkId(newArtwork.id);
    onArtworkCreated?.(newArtwork);
  };

  const handleCancelUpload = () => {
    setMessages(prev => prev.filter(m => m.role !== 'upload-step'));
  };

  return (
    <>
      <style>{`
        @keyframes chatDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>

        <ChatSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          conversations={conversations}
          activeArtworkId={activeArtworkId}
          onSelect={switchThread}
        />

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', padding: '0 16px' }}>

        {/* Header — route title already in the topbar; this just adds context */}
        {activeArtwork && (
          <div style={{ padding: '20px 0 16px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', margin: 0 }}>
              Reflecting on <span style={{ color: 'var(--ink)' }}>{activeArtwork.title}</span>
            </p>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
          {historyLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <TypingDots />
            </div>
          ) : (
            <>
              {hasMoreHistory && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <button
                    onClick={loadEarlierMessages}
                    disabled={loadingMoreHistory}
                    className="pattern-chip pattern-chip--outline"
                  >
                    {loadingMoreHistory ? 'Loading…' : 'Load earlier messages'}
                  </button>
                </div>
              )}
              {messages.map((msg, i) => {
                if (msg.role === 'upload-step') {
                  return <UploadStep key={i} onArtworkCreated={handleArtworkUploaded} onCancel={handleCancelUpload} />;
                }
                if (msg.role === 'reflection') {
                  return (
                    <ReflectionCard
                      key={i}
                      artwork={msg.artwork}
                      reflectionData={msg.reflection}
                      onReview={() => onNavigate?.('reflections', msg.artwork.id)}
                    />
                  );
                }
                if (msg.role === 'note' || msg.display === 'system') return <SystemNote key={i} text={msg.text} />;
                return msg.role === 'user'
                  ? <UserBubble key={i} text={msg.text} />
                  : <AssistantBubble key={i} text={msg.text} />;
              })}
              {loading && <AssistantBubble isTyping />}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Suggested prompts + quiet invitation to add another artwork */}
        {!loading && (
          <div style={{ padding: '8px 0', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            {suggestedPrompts.map((p, i) => (
              <SuggestedPrompt key={i} text={p} onClick={sendMessage} />
            ))}
            {!pendingArtworkId && !hasOpenUploadStep && (
              <AddArtworkAction onClick={() => setMessages(prev => [...prev, { role: 'upload-step' }])} />
            )}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '12px 0 20px', borderTop: '1px solid var(--line)',
          display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0,
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasIdentity ? "Ask about your identity…" : "Upload artwork first to start chatting…"}
            disabled={loading}
            rows={1}
            className="pattern-field-input"
            style={{ flex: 1, resize: 'none', maxHeight: 120, overflowY: 'auto' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="btn btn-primary"
          >
            Send
          </button>
        </div>
          </div>
        </div>
      </div>
    </>
  );
}
