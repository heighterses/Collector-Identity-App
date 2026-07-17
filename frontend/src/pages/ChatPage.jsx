import { useState, useEffect, useRef } from 'react';
import { chat } from '../api.js';

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

const SuggestedPrompt = ({ text, onClick }) => (
  <button
    onClick={() => onClick(text)}
    style={{
      background: 'var(--white)',
      border: '1px solid var(--line)',
      borderRadius: 20,
      padding: '6px 14px',
      fontSize: 'var(--text-xs)',
      color: 'var(--ink-muted)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'border-color 0.15s, color 0.15s',
    }}
    onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
    onMouseLeave={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.color = 'var(--ink-muted)'; }}
  >
    {text}
  </button>
);

export default function ChatPage() {
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
  const bottomRef = useRef(null);

  useEffect(() => {
    chat.getContext()
      .then(data => {
        setHasIdentity(data.has_identity);
        if (data.has_identity) {
          setMessages([{
            role: 'assistant',
            text: "Hello! I've been looking at your identity profile. What would you like to explore about yourself today?",
          }]);
        } else {
          setMessages([{
            role: 'assistant',
            text: "Welcome! Upload your first artwork and generate a reflection to start exploring your creative identity.",
          }]);
        }
      })
      .catch(() => {
        setMessages([{
          role: 'assistant',
          text: "Welcome! I'm here to help you explore your creative identity through your artwork.",
        }]);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed };
    const history = messages.map(m => ({ role: m.role, content: m.text }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSuggestedPrompts([]);
    setLoading(true);

    try {
      const res = await chat.sendMessage(trimmed, history);
      setMessages(prev => [...prev, { role: 'assistant', text: res.response }]);
      if (res.suggested_prompts?.length) setSuggestedPrompts(res.suggested_prompts);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "I'm having trouble connecting right now. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes chatDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>

        {/* Header */}
        <div style={{ padding: '28px 0 16px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>Identity Companion</p>
          <h1 style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-serif)', color: 'var(--ink)', margin: 0 }}>Chat</h1>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
          {messages.map((msg, i) =>
            msg.role === 'user'
              ? <UserBubble key={i} text={msg.text} />
              : <AssistantBubble key={i} text={msg.text} />
          )}
          {loading && <AssistantBubble isTyping />}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        {suggestedPrompts.length > 0 && !loading && (
          <div style={{ padding: '8px 0', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            {suggestedPrompts.map((p, i) => (
              <SuggestedPrompt key={i} text={p} onClick={sendMessage} />
            ))}
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
            style={{
              flex: 1, resize: 'none', border: '1px solid var(--line)',
              borderRadius: 12, padding: '10px 14px',
              fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
              color: 'var(--ink)', background: 'var(--white)',
              outline: 'none', lineHeight: 'var(--leading-normal)',
              maxHeight: 120, overflowY: 'auto',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--line)'}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              background: input.trim() && !loading ? 'var(--ink)' : 'var(--gray-200)',
              color: input.trim() && !loading ? 'var(--white)' : 'var(--gray-400)',
              border: 'none', borderRadius: 12, padding: '10px 18px',
              fontSize: 'var(--text-sm)', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-medium)',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
