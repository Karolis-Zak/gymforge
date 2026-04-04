'use client'

import React, { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { useWorkoutLogStore } from '../store/workoutLogStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useUserStore } from '../store/userStore'
import { calculateVolume } from '../lib/exerciseUtils'
import { BASE_CHART_OPTIONS } from '../lib/chartOptions'
import type { WorkoutLog } from '../store/workoutLogStore'
import { Card, Input, StatCard } from './ui'
import { FiZap, FiTrendingUp, FiAward, FiCalendar, FiActivity } from 'react-icons/fi'
import { AchievementShowcase } from './AchievementShowcase'
import { RecoveryInsights } from './RecoveryInsights'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, Filler, ArcElement)

// Chart.js dark theme defaults
ChartJS.defaults.color = '#94a3b8'
ChartJS.defaults.borderColor = 'rgba(255,255,255,0.06)'
ChartJS.defaults.font.family = 'Inter, system-ui, sans-serif'

const CHART_COLORS = ['#00d4ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#67e8f9']

const groupLogsByWeek = (logs: WorkoutLog[]): Record<string, WorkoutLog[]> => {
  const weeks: Record<string, WorkoutLog[]> = {}
  logs.forEach(log => {
    const d = new Date(log.date)
    const week = `${d.getFullYear()}-W${String(Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7)).padStart(2, '0')}`
    if (!weeks[week]) weeks[week] = []
    weeks[week].push(log)
  })
  return weeks
}

export const WorkoutProgress: React.FC = () => {
  const { getWorkoutStats, getExerciseProgress, logs } = useWorkoutLogStore()
  const { plans } = useWorkoutStore()
  const { weightHistory, logWeight, deleteWeightEntry, profile } = useUserStore()
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [newWeight, setNewWeight] = useState('')

  const stats = getWorkoutStats()
  const allExercises = plans.flatMap(plan => plan.exercises || [])
  const uniqueExercises = Array.from(new Map(allExercises.filter(ex => ex?.id).map(ex => [ex.id, ex])).values())

  const progress = selectedExercise ? getExerciseProgress(selectedExercise) : null

  const completedLogs = useMemo(() => logs.filter(l => l.completed), [logs])

  // Heatmap data - last 84 days (12 weeks)
  const last84Days = useMemo(() => Array.from({ length: 84 }, (_, i) => {
    const d = new Date(Date.now() - (83 - i) * 86400000)
    return d.toISOString().split('T')[0]
  }), [])

  const { weeks, weekKeys, volumePerWeek, workoutsPerWeek } = useMemo(() => {
    const w = groupLogsByWeek(completedLogs)
    const wk = Object.keys(w).sort().slice(-8)
    const vw = wk.map(week =>
      w[week].reduce((sum, log) =>
        sum + calculateVolume(log.exercises), 0))
    const wpw = wk.map(week => w[week].length)
    return { weeks: w, weekKeys: wk, volumePerWeek: vw, workoutsPerWeek: wpw }
  }, [completedLogs])

  const streakDays = useMemo(() =>
    new Set(completedLogs.map(log => log.date.split('T')[0])),
    [completedLogs])

  // Muscle group volume distribution
  const topExercises = useMemo(() => {
    const muscleVolume: Record<string, number> = {}
    completedLogs.forEach(log => {
      log.exercises.forEach(ex => {
        const plan = plans.find(p => p.exercises?.some(e => e.id === ex.exerciseId))
        const exercise = plan?.exercises?.find(e => e.id === ex.exerciseId)
        const name = exercise?.name || ex.exerciseName || 'Other'
        const vol = ex.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0)
        muscleVolume[name] = (muscleVolume[name] || 0) + vol
      })
    })
    return Object.entries(muscleVolume).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [completedLogs, plans])
  const chartColors = CHART_COLORS

  const darkChartOptions = BASE_CHART_OPTIONS

  const isNewUser = completedLogs.length === 0

  return (
    <div className="animate-fade-in space-y-8">
      <h1 className="text-3xl font-display font-bold text-text-primary">Progress</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Workouts" value={stats.totalWorkouts} icon={<FiActivity />} color="primary" />
        <StatCard title="Completed" value={stats.completedWorkouts} icon={<FiAward />} color="success" />
        <StatCard title="Current Streak" value={`${stats.currentStreak}d`} icon={<FiZap />} color="accent" />
        <StatCard title="Longest Streak" value={`${stats.longestStreak}d`} icon={<FiTrendingUp />} color="warning" />
      </div>

      {/* For new users: show weight logging first */}
      {isNewUser && (
        <>
          <Card>
            <h3 className="text-lg font-display font-bold text-text-primary mb-4">Start Tracking</h3>
            <p className="text-sm text-text-secondary mb-4">Track your body weight over time. Complete your first workout to see progress charts.</p>
            <div className="flex items-end gap-3 mb-4">
              <div className="flex-1 max-w-[140px]">
                <Input
                  label="Log today's weight (kg)"
                  type="number"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  placeholder={profile?.weight ? String(profile.weight) : '75'}
                  min={30}
                  max={300}
                  step={0.1}
                />
              </div>
              <button
                onClick={() => {
                  const w = parseFloat(newWeight)
                  if (w > 0) { logWeight(w); setNewWeight('') }
                }}
                disabled={!newWeight || parseFloat(newWeight) <= 0}
                className="px-4 py-2.5 bg-gradient-primary text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all"
              >
                Log
              </button>
            </div>
          </Card>
        </>
      )}

      {/* Charts Grid - Skip for new users */}
      {!isNewUser && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Volume */}
        {volumePerWeek.length > 0 ? (
        <Card>
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Weekly Volume</h3>
          <div className="h-48">
            <Bar
              data={{
                labels: weekKeys.map(w => w.split('-W')[1] ? `W${w.split('-W')[1]}` : w),
                datasets: [{
                  label: 'Volume (kg)',
                  data: volumePerWeek,
                  backgroundColor: 'rgba(0,212,255,0.3)',
                  borderColor: '#00d4ff',
                  borderWidth: 2,
                  borderRadius: 8,
                }],
              }}
              options={darkChartOptions}
            />
          </div>
        </Card>
        ) : (
        <Card>
          <p className="text-sm text-text-muted text-center py-8">Complete your first workout to see volume trends.</p>
        </Card>
        )}

        {/* Workouts Per Week */}
        {workoutsPerWeek.length > 0 ? (
        <Card>
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Workouts Per Week</h3>
          <div className="h-48">
            <Bar
              data={{
                labels: weekKeys.map(w => w.split('-W')[1] ? `W${w.split('-W')[1]}` : w),
                datasets: [{
                  label: 'Workouts',
                  data: workoutsPerWeek,
                  backgroundColor: 'rgba(168,85,247,0.3)',
                  borderColor: '#a855f7',
                  borderWidth: 2,
                  borderRadius: 8,
                }],
              }}
              options={darkChartOptions}
            />
          </div>
        </Card>
        ) : (
        <Card>
          <p className="text-sm text-text-muted text-center py-8">Complete your first workout to see frequency trends.</p>
        </Card>
        )}

        {/* Activity Heatmap */}
        <Card>
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
            <FiCalendar className="inline mr-1" /> Activity (12 weeks)
          </h3>
          <div className="grid grid-cols-12 gap-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={day + i} className="text-[11px] text-text-muted text-center col-span-1 hidden sm:block">
                {i === 0 || i === 2 || i === 4 ? day : ''}
              </div>
            ))}
            {last84Days.map(date => {
              const hasWorkout = streakDays.has(date)
              const isToday = date === new Date().toISOString().split('T')[0]
              return (
                <div
                  key={date}
                  title={`${date}${hasWorkout ? ' - Workout' : ''}`}
                  className={`
                    aspect-square rounded-sm transition-all duration-200
                    ${hasWorkout ? 'bg-primary shadow-[0_0_4px_rgba(0,212,255,0.3)]' : 'bg-white/5'}
                    ${isToday ? 'ring-1 ring-primary/50' : ''}
                  `}
                />
              )
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-white/5" /> No workout
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-primary" /> Workout
            </div>
          </div>
        </Card>

        {/* Volume Distribution */}
        {topExercises.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Volume by Exercise</h3>
            <div className="h-48 flex items-center justify-center">
              <Doughnut
                data={{
                  labels: topExercises.map(([name]) => name),
                  datasets: [{
                    data: topExercises.map(([, vol]) => vol),
                    backgroundColor: chartColors.map(c => c + '40'),
                    borderColor: chartColors,
                    borderWidth: 2,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '60%',
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { color: '#94a3b8', boxWidth: 12, padding: 12 },
                    },
                  },
                }}
              />
            </div>
          </Card>
        )}
      </div>
      )}

      {/* Exercise Progress - Only show if user has workout history */}
      {!isNewUser && (
      <Card>
        <h3 className="text-lg font-display font-bold text-text-primary mb-4">Exercise Progress</h3>
        <div className="mb-4">
          <select
            value={selectedExercise || ''}
            onChange={e => setSelectedExercise(e.target.value || null)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 w-full max-w-xs"
          >
            <option value="" className="bg-background-card">Select an exercise</option>
            {uniqueExercises.map(ex => (
              <option key={ex.id} value={ex.id} className="bg-background-card">{ex.name}</option>
            ))}
          </select>
        </div>

        {selectedExercise && progress && progress.dates.length > 0 ? (
          <div className="h-64">
            <Line
              data={{
                labels: progress.dates.map(d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })),
                datasets: [
                  {
                    label: 'Weight (kg)',
                    data: progress.weights,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0,212,255,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#00d4ff',
                  },
                  {
                    label: 'Total Reps',
                    data: progress.totalReps,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168,85,247,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#a855f7',
                  },
                ],
              }}
              options={{
                ...darkChartOptions,
                plugins: {
                  legend: {
                    display: true,
                    labels: { color: '#94a3b8', usePointStyle: true },
                  },
                },
              }}
            />
          </div>
        ) : selectedExercise ? (
          <div className="text-center py-12 text-text-muted">
            No data yet for this exercise. Complete a workout to see progress.
          </div>
        ) : (
          <div className="text-center py-12 text-text-muted">
            Select an exercise above to view your progress over time.
          </div>
        )}
      </Card>
      )}

      {/* Body Weight Tracking */}
      <Card>
        <h3 className="text-lg font-display font-bold text-text-primary mb-4">Body Weight</h3>
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-1 max-w-[140px]">
            <Input
              label="Log today's weight (kg)"
              type="number"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              placeholder={profile?.weight ? String(profile.weight) : '75'}
              min={30}
              max={300}
              step={0.1}
            />
          </div>
          <button
            onClick={() => {
              const w = parseFloat(newWeight)
              if (w > 0) { logWeight(w); setNewWeight('') }
            }}
            disabled={!newWeight || parseFloat(newWeight) <= 0}
            className="px-4 py-2.5 bg-gradient-primary text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all"
          >
            Log
          </button>
        </div>
        {weightHistory.length > 1 ? (
          <div className="h-48">
            <Line
              data={{
                labels: weightHistory.slice(-30).map(e => new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })),
                datasets: [{
                  label: 'Weight (kg)',
                  data: weightHistory.slice(-30).map(e => e.weight),
                  borderColor: '#a855f7',
                  backgroundColor: 'rgba(168,85,247,0.1)',
                  fill: true,
                  tension: 0.3,
                  pointRadius: 3,
                  pointBackgroundColor: '#a855f7',
                }],
              }}
              options={{
                ...darkChartOptions,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        ) : weightHistory.length === 1 ? (
          <p className="text-sm text-text-muted text-center py-4">Log at least 2 entries to see your weight trend.</p>
        ) : (
          <p className="text-sm text-text-muted text-center py-4">Start logging your weight to track changes over time.</p>
        )}
        {weightHistory.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <h4 className="text-xs text-text-muted uppercase tracking-wider mb-2">Recent entries</h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {[...weightHistory].reverse().slice(0, 10).map(entry => (
                <div key={entry.date} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-text-secondary">
                    {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-primary font-medium">{entry.weight} kg</span>
                    <button
                      onClick={() => deleteWeightEntry(entry.date)}
                      className="text-text-muted hover:text-danger text-xs transition-colors"
                      aria-label="Delete entry"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Achievements - Only for users with workout history */}
      {!isNewUser && (
      <div>
        <h2 className="text-2xl font-display font-bold text-text-primary mb-6">Achievements</h2>
        <AchievementShowcase />
      </div>
      )}

      {/* Recovery Insights - Only for users with workout history */}
      {!isNewUser && (
      <div>
        <h2 className="text-2xl font-display font-bold text-text-primary mb-6">Recovery</h2>
        <RecoveryInsights />
      </div>
      )}
    </div>
  )
}
