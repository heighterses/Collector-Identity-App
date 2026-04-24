import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#14b8a6",
];

const buildPieData = (items, label) => {
  if (!items || items.length === 0) return null;
  return {
    labels: items.map(([name]) => name),
    datasets: [{
      label,
      data: items.map(([_, count]) => count),
      backgroundColor: items.map((_, i) => COLORS[i % COLORS.length]),
      borderWidth: 1
    }]
  };
};

const PIE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { size: 11, family: 'Inter, sans-serif' },
        padding: 12,
        boxWidth: 12,
      }
    }
  }
};

const ProfilePieCharts = ({ patterns }) => {
  const traitsData   = buildPieData(patterns?.traits,   "Traits");
  const emotionsData = buildPieData(patterns?.emotions, "Emotions");

  if (!traitsData && !emotionsData) return null;

  return (
    <div className="pf-pie-charts">
      {traitsData && (
        <div className="pf-pie-item">
          <p className="pf-pie-label">Traits Distribution</p>
          <Pie data={traitsData} options={PIE_OPTIONS} />
        </div>
      )}
      {emotionsData && (
        <div className="pf-pie-item">
          <p className="pf-pie-label">Emotions Distribution</p>
          <Pie data={emotionsData} options={PIE_OPTIONS} />
        </div>
      )}
    </div>
  );
};

export default ProfilePieCharts;
