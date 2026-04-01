/**
 * Base Chart.js options shared across Dashboard and WorkoutProgress
 * Both components use responsive dark-themed bar/line charts with
 * no legend, zero-based Y axis, and muted tick colors
 */
export const BASE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#475569' },
    },
    x: {
      grid: { display: false },
      ticks: { color: '#475569', maxRotation: 0 },
    },
  },
} as const
