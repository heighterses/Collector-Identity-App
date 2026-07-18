import { useEffect, useState } from 'react';

/**
 * Chart.js reads colors once at render time and doesn't react to CSS
 * custom property changes. This hook watches the `data-mode` attribute
 * (toggled by Layout.jsx / Settings.jsx) via MutationObserver and returns
 * a value that changes identity on every flip — use it as a dependency
 * (or React `key`) to force chart datasets to rebuild with fresh tokens.
 */
export function useThemeMode() {
  const [mode, setMode] = useState(
    () => document.documentElement.getAttribute('data-mode') || 'light'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setMode(document.documentElement.getAttribute('data-mode') || 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
    return () => observer.disconnect();
  }, []);

  return mode;
}

/** Reads the current value of a CSS custom property from :root. */
export function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** The 5-step segment palette used by proportion charts (donut rings). */
export function readSegmentPalette() {
  return [1, 2, 3, 4, 5].map((i) => readToken(`--seg-${i}`));
}
