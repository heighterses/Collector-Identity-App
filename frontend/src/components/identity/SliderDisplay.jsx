import { useState, useEffect, useRef } from "react";

function SliderDisplay({ trait, onUpdate }) {
  const [localValue, setLocalValue] = useState(Number(trait.value) || 0);
  const committedRef = useRef(false);

  useEffect(() => {
    setLocalValue(Number(trait.value) || 0);
  }, [trait.value]);

  const handleChange = (e) => {
    setLocalValue(Number(e.target.value));
  };

  const handleRelease = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    setTimeout(() => { committedRef.current = false; }, 100);
    onUpdate(trait.id, { value: String(localValue) });
  };

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
        <span className="identity-trait-label">{trait.label}</span>
        <span style={{ fontSize: 11, color: "var(--gray-400)", fontVariantNumeric: "tabular-nums" }}>
          {localValue}<span style={{ color: "var(--gray-300)" }}>/10</span>
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={localValue}
        onChange={handleChange}
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}
        className="trait-slider"
      />
    </div>
  );
}

export default SliderDisplay;
