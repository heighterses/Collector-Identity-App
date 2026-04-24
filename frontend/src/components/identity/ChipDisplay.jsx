import { useState } from "react";

function ChipDisplay({ trait, onUpdate }) {
  const isActive = trait.value === "true";
  const [editing, setEditing] = useState(false);
  const [labelInput, setLabelInput] = useState(trait.label);

  const handleToggle = () => {
    onUpdate(trait.id, { value: String(!isActive) });
  };

  const handleLabelDoubleClick = (e) => {
    e.stopPropagation();
    setLabelInput(trait.label);
    setEditing(true);
  };

  const commitLabel = () => {
    setEditing(false);
    const trimmed = labelInput.trim();
    if (trimmed && trimmed !== trait.label) {
      onUpdate(trait.id, { label: trimmed });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") commitLabel();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
      {editing ? (
        <input
          autoFocus
          value={labelInput}
          onChange={e => setLabelInput(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={handleKeyDown}
          className="trait-text-input"
          style={{ maxWidth: 200 }}
        />
      ) : (
        <span
          className="identity-trait-label"
          onDoubleClick={handleLabelDoubleClick}
          style={{ cursor: "text" }}
          title="Double-click to rename"
        >
          {trait.label}
        </span>
      )}
      <span
        onClick={handleToggle}
        className={`trait-chip-toggle ${isActive ? "trait-chip-toggle--active" : "trait-chip-toggle--inactive"}`}
      >
        {isActive ? "✓ Enabled" : "✕ Disabled"}
      </span>
    </div>
  );
}

export default ChipDisplay;
