function ConfirmSwitch({ trait, onUpdate }) {
  const isConfirmed = trait.is_confirmed !== false;

  const handleToggle = () => {
    onUpdate(trait.id, { is_confirmed: !isConfirmed });
  };

  return (
    <div className="trait-confirm-wrap">
      <div
        onClick={handleToggle}
        className="trait-confirm-track"
        style={{ backgroundColor: isConfirmed ? "var(--success)" : "var(--gray-200)" }}
        title={isConfirmed ? "Confirmed — click to reject" : "Rejected — click to confirm"}
      >
        <div
          className="trait-confirm-thumb"
          style={{ left: isConfirmed ? 19 : 3 }}
        />
      </div>
      <span
        className="trait-confirm-label"
        style={{ color: isConfirmed ? "var(--success)" : "var(--gray-400)" }}
      >
        {isConfirmed ? "Confirmed" : "Rejected"}
      </span>
    </div>
  );
}

export default ConfirmSwitch;
