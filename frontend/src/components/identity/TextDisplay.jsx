import { useState, useEffect } from "react";

function TextDisplay({ trait, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(trait.value || "");

  useEffect(() => {
    setLocalValue(trait.value || "");
  }, [trait.value]);

  const commit = () => {
    if (!editing) return;
    setEditing(false);
    const trimmed = localValue.trim();
    if (trimmed && trimmed !== trait.value) {
      onUpdate(trait.id, { value: trimmed });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      setLocalValue(trait.value || "");
      setEditing(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
      <span className="identity-trait-label" style={{ flexShrink: 0 }}>{trait.label}</span>
      <span style={{ color: "var(--gray-300)", fontSize: 12, flexShrink: 0 }}>·</span>
      {editing ? (
        <input
          autoFocus
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="trait-text-input"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className="trait-text-value"
          title="Click to edit"
        >
          {trait.value || <span style={{ color: "var(--gray-300)", fontStyle: "italic" }}>click to edit</span>}
        </span>
      )}
    </div>
  );
}

export default TextDisplay;
