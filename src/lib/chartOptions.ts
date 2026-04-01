export const BASE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569' } },
    x: { grid: { display: false }, ticks: { color: '#475569', maxRotation: 0 } },
  },
} as const
