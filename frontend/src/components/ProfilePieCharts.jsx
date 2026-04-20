import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
  } from 'chart.js';
  
  import { Pie } from 'react-chartjs-2';
  
  ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
  );
  
  // 🎯 Convert backend data → chart format
  const COLORS = [
    "#6366f1", // indigo
    "#22c55e", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#06b6d4", // cyan
    "#a855f7", // purple
    "#14b8a6", // teal
  ];
  
  const buildPieData = (items, label) => {
    if (!items || items.length === 0) return null;
  
    return {
      labels: items.map(([name]) => name),
      datasets: [
        {
          label,
          data: items.map(([_, count]) => count),
          backgroundColor: items.map((_, i) => COLORS[i % COLORS.length]),
          borderWidth: 1
        }
      ]
    };
  };
  
  const ProfilePieCharts = ({ patterns }) => {
    const traitsData = buildPieData(patterns?.traits, "Traits");
    const emotionsData = buildPieData(patterns?.emotions, "Emotions");
  
    return (
      <div style={{ marginTop: 20 }}>
  
        {/* TRAITS PIE */}
        {traitsData && (
          <div style={{ marginBottom: 30 }}>
            <h4>Traits Distribution</h4>
            <Pie data={traitsData} />
          </div>
        )}
  
        {/* EMOTIONS PIE */}
        {emotionsData && (
          <div style={{ marginBottom: 30 }}>
            <h4>Emotions Distribution</h4>
            <Pie data={emotionsData} />
          </div>
        )}
  
      </div>
    );
  };
  
  export default ProfilePieCharts;