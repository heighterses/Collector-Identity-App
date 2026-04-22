function ConfirmSwitch({ trait, onUpdate }) {
  const isConfirmed = trait.is_confirmed !== false;

  const handleToggle = () => {
    onUpdate(trait.id, { is_confirmed: !isConfirmed });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
      }}
    >
      {/* Toggle track */}
      <div
        onClick={handleToggle}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: isConfirmed ? "#22c55e" : "#d1d5db",
          position: "relative",
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          flexShrink: 0,
        }}
      >
        {/* Toggle thumb */}
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: "#fff",
            position: "absolute",
            top: 3,
            left: isConfirmed ? 23 : 3,
            transition: "left 0.2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 12,
          color: isConfirmed ? "#16a34a" : "#9ca3af",
          fontWeight: 500,
        }}
      >
        {isConfirmed ? "Confirmed" : "Rejected"}
      </span>
    </div>
  );
}

export default ConfirmSwitch;
