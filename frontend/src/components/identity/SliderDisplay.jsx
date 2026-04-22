import { useState, useEffect, useRef } from "react";

function SliderDisplay({ trait, onUpdate }) {
  const [localValue, setLocalValue] = useState(Number(trait.value) || 0);
  const committedRef = useRef(false);

  // Keep local state in sync if backend value changes
  useEffect(() => {
    setLocalValue(Number(trait.value) || 0);
  }, [trait.value]);

  const handleChange = (e) => {
    setLocalValue(Number(e.target.value));
  };

  const handleRelease = () => {
    // Guard against duplicate commits from both onMouseUp and onTouchEnd firing
    if (committedRef.current) return;
    committedRef.current = true;
    setTimeout(() => { committedRef.current = false; }, 100);

    onUpdate(trait.id, { value: String(localValue) });
  };

  return (
    <div>
      <strong>{trait.label}</strong>: {localValue} / 10
      <br />
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={localValue}
        onChange={handleChange}
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}
      />
    </div>
  );
}

export default SliderDisplay;
