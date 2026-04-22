import { useState, useEffect } from "react";

function TextDisplay({ trait, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(trait.value || "");

  // Sync with backend if trait.value changes
  useEffect(() => {
    setLocalValue(trait.value || "");
  }, [trait.value]);

  const handleClick = () => {
    setEditing(true);
  };

  const commit = () => {
    if (!editing) return; // guard against double commit (Enter → blur)
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
    <div>
      <strong>{trait.label}</strong>:{" "}
      {editing ? (
        <input
          autoFocus
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span onClick={handleClick} style={{ cursor: "text" }}>
          {trait.value || "Click to edit..."}
        </span>
      )}
    </div>
  );
}

export default TextDisplay;
