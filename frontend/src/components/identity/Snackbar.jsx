import { useEffect, useState } from "react";
import { useTimeAgo } from "../../utils/time";

function Snackbar({ message, timestamp, onClose, onAction, actionLabel }) {
  const [visible, setVisible] = useState(false);
  const timeAgo = useTimeAgo(timestamp);

  useEffect(() => {
    // Trigger slide-in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto dismiss after 3s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // wait for fade out
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "20px"})`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease, transform 0.3s ease",
        backgroundColor: "#1c1917",
        color: "#fff",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        zIndex: 9999,
        minWidth: 280,
        maxWidth: 400,
      }}
    >
      {/* Check icon */}
      <span style={{ color: "#22c55e", fontSize: 16, flexShrink: 0 }}>✔</span>

      {/* Message */}
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
        {message}
        {timestamp && (
          <span style={{ display: "block", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            {timeAgo}
          </span>
        )}
      </span>

      {/* Optional action */}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          style={{
            background: "none",
            border: "none",
            color: "#86efac",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            padding: "0 4px",
            flexShrink: 0,
          }}
        >
          {actionLabel}
        </button>
      )}

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          background: "none",
          border: "none",
          color: "#9ca3af",
          fontSize: 16,
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default Snackbar;
