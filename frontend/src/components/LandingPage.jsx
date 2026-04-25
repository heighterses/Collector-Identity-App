import { useState, useEffect } from 'react';
import AuthModal from './AuthModal.jsx';

const SAMPLE = `This work carries a quiet tension between presence and absence — the way light falls across the composition suggests not just a moment captured, but a feeling held in suspension. There is an intentionality here that speaks to a practiced eye: the artist knows what to include, but more importantly, what to leave out.`;

// ── Curated artwork dataset ───────────────────────────────────────────────────
// Sourced from Unsplash (public domain / free to use)
const ARTWORKS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80',
    title: 'Quiet Geometry',
    subtitle: 'AI reflection available',
    date: 'March 2024',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&q=80',
    title: 'Suspended Light',
    subtitle: 'AI reflection available',
    date: 'January 2024',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80',
    title: 'Chromatic Study',
    subtitle: 'AI reflection available',
    date: 'November 2023',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80',
    title: 'Interior Silence',
    subtitle: 'AI reflection available',
    date: 'September 2023',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80',
    title: 'Soft Boundary',
    subtitle: 'AI reflection available',
    date: 'July 2023',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&q=80',
    title: 'Trace of Form',
    subtitle: 'AI reflection available',
    date: 'May 2023',
  },
];

// ── Rotating artwork card ─────────────────────────────────────────────────────
const RotatingArtworkCard = () => {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % ARTWORKS.length);
        // Fade in
        setVisible(true);
      }, 400); // matches CSS transition duration
    }, 6000); // rotate every 6 seconds

    return () => clearInterval(interval);
  }, []);

  const art = ARTWORKS[current];

  return (
    <div className="landing-card-main">
      <div
        className="landing-rotating-img"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <img
          src={art.image}
          alt={art.title}
          className="landing-rotating-img-el"
        />
        {/* Progress bar */}
        <div className="landing-rotating-progress" key={current} />
      </div>
      <div
        className="landing-card-body"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
      >
        <p className="landing-card-label">
          <span className="landing-chip-dot" style={{ display: 'inline-block', marginRight: 6 }} />
          {art.subtitle}
        </p>
        <p className="landing-card-title">{art.title}</p>
        <p className="landing-card-date">Added {art.date}</p>
      </div>
    </div>
  );
};

const LandingPage = ({ onAuthSuccess }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const open = (mode) => { setAuthMode(mode); setShowAuthModal(true); };

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-header-content">
          <h1 className="landing-logo">Collector Identity</h1>
          <nav className="landing-nav">
            <button onClick={() => open('login')} className="landing-nav-link">Sign in</button>
            <button onClick={() => open('signup')} className="landing-nav-button">Get started</button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero-section">
        <div className="landing-hero-inner">
          <div className="landing-hero-left">
            <div className="landing-eyebrow">
              <span className="landing-eyebrow-dot" />
              Private digital gallery
            </div>
            <h1 className="landing-h1">
              Your art,<br /><em>reflected</em>
            </h1>
            <p className="landing-lead">
              Add your artwork and receive a thoughtful, AI-generated interpretation — a genuine reading of your creative identity.
            </p>
            <div className="landing-actions">
              <button onClick={() => open('signup')} className="landing-btn-primary">
                Enter the gallery
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
              </button>
              <button onClick={() => open('login')} className="landing-btn-secondary">Sign in</button>
            </div>
          </div>

          <div className="landing-hero-right">
            <div className="landing-visual-stack">
              <div className="landing-card-back" />
              <RotatingArtworkCard />
              <div className="landing-reflection-chip">
                <div className="landing-chip-label">
                  <span className="landing-chip-dot" />
                  Reflection generated
                </div>
                <div className="landing-chip-lines">
                  <div className="landing-chip-line" />
                  <div className="landing-chip-line" />
                  <div className="landing-chip-line" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how">
        <div className="landing-section-inner">
          <p className="landing-section-label">How it works</p>
          <h2 className="landing-section-title">Three steps to deeper understanding</h2>
          <p className="landing-section-sub">A simple process that turns your artwork into a meaningful reading of your creative identity.</p>
          <div className="landing-steps">
            {[
              { n: '01', title: 'Add your artwork', desc: 'Upload an image or describe your piece in words. Any medium, any style — what matters is that it means something to you.' },
              { n: '02', title: 'Receive a reflection', desc: 'Our AI reads your work carefully and generates a thoughtful interpretation — not a description, but a genuine reading.' },
              { n: '03', title: 'Refine and explore', desc: 'Share your own thoughts to guide the reflection further. The more you engage, the more personal it becomes.' },
            ].map((s) => (
              <div className="landing-step" key={s.n}>
                <div className="landing-step-num">{s.n}</div>
                <h3 className="landing-step-title">{s.title}</h3>
                <p className="landing-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reflection preview */}
      <section className="landing-preview">
        <div className="landing-preview-inner">
          <p className="landing-section-label" style={{ textAlign: 'center', marginBottom: 'var(--sp-3)' }}>Example reflection</p>
          <h2 className="landing-section-title" style={{ marginBottom: 'var(--sp-16)' }}>What a reflection reads like</h2>
          <div className="landing-preview-card">
            <div className="landing-preview-card-header">
              <span className="landing-preview-card-label">Reflection</span>
              <span className="landing-preview-badge">
                <span style={{ width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
                AI generated
              </span>
            </div>
            <div className="landing-preview-card-body">
              <p className="landing-preview-text">{SAMPLE}</p>
            </div>
            <div className="landing-preview-footer">
              <span className="landing-preview-artwork">On &ldquo;Untitled Study No. 4&rdquo;</span>
              <button onClick={() => open('signup')} className="btn btn-primary btn-sm">Get yours</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section">
        <div className="landing-cta-inner">
          <h2 className="landing-cta-title">Your work deserves to be understood</h2>
          <p className="landing-cta-sub">Join collectors and artists who use Collector Identity to explore the meaning behind their creative practice.</p>
          <button onClick={() => open('signup')} className="landing-cta-btn">
            Enter the gallery
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span className="landing-footer-brand">Collector Identity</span>
          <p className="landing-footer-copy">A private space for art and reflection.</p>
        </div>
      </footer>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => { setShowAuthModal(false); onAuthSuccess(); }}
          onSwitchMode={(m) => setAuthMode(m)}
        />
      )}
    </div>
  );
};

export default LandingPage;
