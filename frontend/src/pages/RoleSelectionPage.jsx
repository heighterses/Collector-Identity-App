import { useState } from "react";

const ROLES = [
  {
    id: "artist",
    label: "Artist",
    description: "I create work that reflects who I am",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2v-.5c0-.55-.22-1.05-.59-1.41-.36-.36-.59-.86-.59-1.41 0-1.1.9-2 2-2h2c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" stroke="#5a5248"/>
        <circle cx="6.5" cy="11.5" r="1.5" fill="#5a5248"/>
        <circle cx="9.5" cy="7.5" r="1.5" fill="#5a5248"/>
        <circle cx="14.5" cy="7.5" r="1.5" fill="#5a5248"/>
        <circle cx="17.5" cy="11.5" r="1.5" fill="#5a5248"/>
      </svg>
    ),
    bg: "radial-gradient(circle at 30% 30%, #f6efe7, #e6dacb)",
    glowColor: "rgba(181,129,58,0.16)"
  },
  {
    id: "collector",
    label: "Collector",
    description: "I curate and preserve meaningful pieces",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5a5248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <rect x="6" y="6" width="12" height="12" rx="1"/>
        <path d="M6 14l3-3 2 2 3-4 4 5"/>
      </svg>
    ),
    bg: "radial-gradient(circle at 30% 30%, #eef1f4, #dfe5ea)",
    glowColor: "rgba(74,96,112,0.14)"
  },
  {
    id: "enthusiast",
    label: "Enthusiast",
    description: "I explore art and find what resonates",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5a5248" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    ),
    bg: "radial-gradient(circle at 30% 30%, #f7f2e6, #e9dcc2)",
    glowColor: "rgba(181,155,58,0.18)"
  }
];

function RoleSelectionPage({ onRoleSelected }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!selected || loading) return;
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: selected })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      onRoleSelected(selected);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--paper)",
      display: "flex",
      justifyContent: "center",
      paddingTop: "var(--sp-20)",
      paddingBottom: "var(--sp-16)",
      paddingLeft: "var(--sp-6)",
      paddingRight: "var(--sp-6)",
      fontFamily: "var(--font-sans)"
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Header */}
        <div style={{ marginBottom: "var(--sp-10)" }}>
          <p style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-medium)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "var(--sp-4)"
          }}>
            Getting started
          </p>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-regular)",
            color: "#3E2F23",
            lineHeight: "var(--leading-snug)",
            marginBottom: "var(--sp-3)"
          }}>
            How do you see yourself<br />in the art world?
          </h1>
          <p style={{
            fontSize: "var(--text-sm)",
            color: "#8A7866",
            lineHeight: "var(--leading-normal)"
          }}>
            Your perspective shapes how we build your identity.
          </p>
        </div>

        {/* Role cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)", marginBottom: "var(--sp-8)" }}>
          {ROLES.map(role => {
            const isSelected = selected === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-5)",
                  padding: "var(--sp-5) var(--sp-6)",
                  borderRadius: 10,
                  border: `1.5px solid ${isSelected ? "#c4a882" : "var(--line)"}`,
                  backgroundColor: isSelected ? "#fdf6ec" : "var(--white)",
                  color: isSelected ? "#3A2B1F" : "#3E2F23",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease-out",
                  outline: "none",
                  width: "100%",
                  transform: isSelected ? "scale(1.03)" : "scale(1)",
                  boxShadow: isSelected
                    ? `0 4px 14px rgba(181,129,58,0.14), 0 1px 3px rgba(0,0,0,0.06)`
                    : "0 1px 3px rgba(0,0,0,0.04)"
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "var(--gray-400)";
                    e.currentTarget.style.backgroundColor = "var(--paper-2)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "var(--line)";
                    e.currentTarget.style.backgroundColor = "var(--white)";
                  }
                }}
                onFocus={e => {
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,13,13,0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{
                  width: 56,
                  height: 56,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "9999px",
                  background: isSelected
                    ? "radial-gradient(circle at 30% 30%, #f5e8d0, #e8d0a8)"
                    : role.bg,
                  flexShrink: 0,
                  boxShadow: isSelected
                    ? "0 6px 16px rgba(181,129,58,0.2), inset 0 2px 3px rgba(255,255,255,0.7), inset 0 -3px 8px rgba(120,80,20,0.1)"
                    : "0 4px 10px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -2px 6px rgba(0,0,0,0.08)",
                  transform: isSelected ? "scale(1.06)" : "scale(1)",
                  transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out, background 0.15s ease-out",
                  filter: isSelected ? "brightness(1.04)" : "none"
                }}>
                  <span style={{
                    display: "flex",
                    filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.6))",
                    opacity: isSelected ? 0.9 : 1
                  }}>
                    {role.icon}
                  </span>
                </span>
                <div>
                  <div style={{
                    fontSize: "var(--text-base)",
                    fontWeight: "var(--weight-medium)",
                    marginBottom: 2,
                    color: isSelected ? "#3A2B1F" : "#3E2F23"
                  }}>
                    {role.label}
                  </div>
                  <div style={{
                    fontSize: "var(--text-sm)",
                    color: isSelected ? "#6B5A48" : "#8A7866",
                    lineHeight: "var(--leading-snug)"
                  }}>
                    {role.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <p style={{
            fontSize: "var(--text-sm)",
            color: "var(--error)",
            marginBottom: "var(--sp-4)"
          }}>
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          style={{
            width: "100%",
            padding: "var(--sp-4) var(--sp-6)",
            borderRadius: 10,
            border: "none",
            backgroundColor: selected ? "#A97455" : "#E6DDD4",
            color: selected ? "#ffffff" : "#A89987",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
            letterSpacing: "0.02em",
            cursor: selected ? "pointer" : "not-allowed",
            transition: "background-color 0.15s ease, box-shadow 0.15s ease",
            boxShadow: selected ? "0 2px 8px rgba(169,116,85,0.25)" : "none"
          }}
          onMouseEnter={e => {
            if (selected) e.currentTarget.style.backgroundColor = "#956347";
          }}
          onMouseLeave={e => {
            if (selected) e.currentTarget.style.backgroundColor = "#A97455";
          }}
          onMouseDown={e => {
            if (selected) e.currentTarget.style.backgroundColor = "#7F533A";
          }}
          onMouseUp={e => {
            if (selected) e.currentTarget.style.backgroundColor = "#956347";
          }}
        >
          {loading ? "Saving…" : "Continue"}
        </button>

      </div>
    </div>
  );
}

export default RoleSelectionPage;
