import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

import { Doughnut } from 'react-chartjs-2';
import { useThemeMode, readSegmentPalette, readToken } from '../utils/useThemeMode.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const buildDonutData = (items, label, palette) => {
  if (!items || items.length === 0) return null;
  return {
    labels: items.map(([name]) => name),
    datasets: [{
      label,
      data: items.map(([_, count]) => count),
      backgroundColor: items.map((_, i) => palette[i % palette.length]),
      borderColor: readToken('--card-bg'),
      borderWidth: 2,
    }]
  };
};

const ProfilePieCharts = ({ patterns }) => {
  // Chart.js snapshots colors at render time — mode acts as a re-render
  // trigger so the palette stays in sync with light/dark (see
  // useThemeMode.js / DESIGN-PATTERNS.md "Chart mode-sync").
  const mode = useThemeMode();

  const { palette, textSecondary } = useMemo(() => ({
    palette: readSegmentPalette(),
    textSecondary: readToken('--text-secondary'),
  }), [mode]);

  const donutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 11, family: 'Arial, Helvetica, sans-serif' },
          color: textSecondary,
          padding: 12,
          boxWidth: 10,
        }
      }
    }
  }), [textSecondary]);

  const traitsData   = useMemo(() => buildDonutData(patterns?.traits,   'Traits',   palette), [patterns, palette]);
  const emotionsData = useMemo(() => buildDonutData(patterns?.emotions, 'Emotions', palette), [patterns, palette]);

  if (!traitsData && !emotionsData) return null;

  return (
    <div className="pf-pie-charts">
      {traitsData && (
        <div className="pf-pie-item">
          <p className="pattern-eyebrow">Traits distribution</p>
          <Doughnut key={`traits-${mode}`} data={traitsData} options={donutOptions} />
        </div>
      )}
      {emotionsData && (
        <div className="pf-pie-item">
          <p className="pattern-eyebrow">Emotions distribution</p>
          <Doughnut key={`emotions-${mode}`} data={emotionsData} options={donutOptions} />
        </div>
      )}
    </div>
  );
};

export default ProfilePieCharts;
