import { useState, useEffect } from "react";

/**
 * Format a UTC timestamp string to user's local timezone.
 * Returns friendly relative time or localized date string.
 */
export function formatTimestamp(utcString) {
  if (!utcString) return "";

  const date = new Date(utcString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  if (diffDay === 1) return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Hook that returns a live-updating "time ago" string.
 * Updates every 30 seconds. Cleans up on unmount.
 */
export function useTimeAgo(timestamp) {
  const [timeAgo, setTimeAgo] = useState(() => formatTimestamp(timestamp));

  useEffect(() => {
    if (!timestamp) return;
    setTimeAgo(formatTimestamp(timestamp));
    const interval = setInterval(() => {
      setTimeAgo(formatTimestamp(timestamp));
    }, 30000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return timeAgo;
}
