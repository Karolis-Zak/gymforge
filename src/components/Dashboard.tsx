'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserStore } from '../store/userStore'
import { useWorkoutLogStore, type WorkoutLog } from '../store/workoutLogStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useOnboardingStore } from '../store/onboardingStore'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Tooltip, Filler
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { FiZap, FiTrendingUp, FiAward, FiClock, FiPlay, FiArrowRight, FiRefreshCw, FiCompass, FiChevronDown, FiChevronUp, FiCalendar } from 'react-icons/fi'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler)

const CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569' } },
    x: { grid: { display: false }, ticks: { color: '#475569', maxRotation: 0 } },
  },
} as const

function groupByWeek(logs: WorkoutLog[]): Record<string, WorkoutLog[]> {
  const weeks: Record<string, WorkoutLog[]> = {}
  logs.filter(l => l.completed).forEach(log => {
    const d = new Date(log.date)
    const week = `W${String(Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7)).padStart(2, '0')}`
    if (!weeks[week]) weeks[week] = []
    weeks[week].push(log)
  })
  return weeks
}

export function Dashboard() {
  const router = useRouter()
  const { profile } = useUserStore()
  const { currentWorkout, logs, getWorkoutStats, startWorkout } = useWorkoutLogStore()
  const { shouldSuggestRefresh, snoozeRefresh } = useOnboardingStore()
  const { plans } = useWorkoutStore()
  const stats = getWorkoutStats()
  const [expandedStat, setExpandedStat] = useState<string | null>(null)

  const completedLogs = logs.filter(l => l.completed)
  const recentLogs = completedLogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Weekly data
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const thisWeekLogs = completedLogs.filter(l => new Date(l.date) >= weekStart)
  const weeklyVolume = thisWeekLogs.reduce((total, log) =>
    total + log.exercises.reduce((exTotal, ex) =>
      exTotal + ex.sets.reduce((setTotal, set) =>
        setTotal + ((set.weight || 0) * (set.reps || 0)), 0), 0), 0)

  // Chart data for last 8 weeks
  const weeks = groupByWeek(completedLogs)
  const weekKeys = Object.keys(weeks).sort().slice(-8)

  const volumePerWeek = weekKeys.map(week =>
    weeks[week].reduce((sum, log) =>
      sum + log.exercises.reduce((exSum, ex) =>
        exSum + ex.sets.reduce((setSum, set) =>
          setSum + ((set.weight || 0) * (set.reps || 0)), 0), 0), 0))

  const workoutsPerWeek = weekKeys.map(week => weeks[week].length)

  // Streak history — last 30 days
  const streakDays = new Set(completedLogs.map(l => l.date.split('T')[0]))
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000)
    return d.toISOString().split('T')[0]
  })

  const userName = profile?.name || 'Athlete'
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const toggleStat = (id: string) => setExpandedStat(prev => prev === id ? null : id)

  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">
            Welcome back, <span className="gradient-text">{userName}</span>
          </h1>
          <p className="text-text-secondary mt-1">Let&apos;s crush it today.</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-mixed flex items-center justify-center">
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>
      </div>

      {/* Active Workout Banner */}
      {currentWorkout && (
        <Card className="border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <FiPlay className="text-primary text-xl" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Workout in progress</p>
                <h3 className="text-lg font-bold text-text-primary">{currentWorkout.planName}</h3>
              </div>
            </div>
            <Link href="/workout">
              <Button variant="primary" size="md">
                Continue <FiArrowRight />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Interactive Stats Grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Current Streak */}
          <button onClick={() => toggleStat('streak')} className="text-left">
            <Card className={`transition-all ${expandedStat === 'streak' ? 'border-primary/30' : ''}`} padding="sm">
              <div className="p-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Streak</span>
                  <FiZap className="text-primary text-sm" />
                </div>
                <div className="text-2xl font-bold font-display text-primary">{stats.currentStreak}d</div>
                <div className="text-xs text-text-muted mt-0.5">Best: {stats.longestStreak}d</div>
              </div>
            </Card>
          </button>

          {/* This Week */}
          <button onClick={() => toggleStat('week')} className="text-left">
            <Card className={`transition-all ${expandedStat === 'week' ? 'border-accent/30' : ''}`} padding="sm">
              <div className="p-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">This Week</span>
                  <FiTrendingUp className="text-accent text-sm" />
                </div>
                <div className="text-2xl font-bold font-display text-accent">{thisWeekLogs.length}</div>
                <div className="text-xs text-text-muted mt-0.5">workouts</div>
              </div>
            </Card>
          </button>

          {/* Weekly Volume */}
          <button onClick={() => toggleStat('volume')} className="text-left">
            <Card className={`transition-all ${expandedStat === 'volume' ? 'border-success/30' : ''}`} padding="sm">
              <div className="p-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Volume</span>
                  <FiAward className="text-success text-sm" />
                </div>
                <div className="text-2xl font-bold font-display text-success">
                  {weeklyVolume > 1000 ? `${(weeklyVolume / 1000).toFixed(1)}t` : `${weeklyVolume}kg`}
                </div>
                <div className="text-xs text-text-muted mt-0.5">this week</div>
              </div>
            </Card>
          </button>

          {/* Total Workouts */}
          <button onClick={() => toggleStat('total')} className="text-left">
            <Card className={`transition-all ${expandedStat === 'total' ? 'border-warning/30' : ''}`} padding="sm">
              <div className="p-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Total</span>
                  <FiClock className="text-warning text-sm" />
                </div>
                <div className="text-2xl font-bold font-display text-warning">{stats.completedWorkouts}</div>
                <div className="text-xs text-text-muted mt-0.5">completed</div>
              </div>
            </Card>
          </button>
        </div>

        {/* Expanded Stat Detail */}
        {expandedStat === 'streak' && (
          <Card className="animate-fade-in border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary">Streak — Last 30 Days</h3>
              <button onClick={() => setExpandedStat(null)} className="text-text-muted"><FiChevronUp size={14} /></button>
            </div>
            <div className="grid grid-cols-10 sm:grid-cols-15 gap-1">
              {last30Days.map(date => {
                const hasWorkout = streakDays.has(date)
                const isToday = date === new Date().toISOString().split('T')[0]
                const dayName = new Date(date).toLocaleDateString('en-GB', { weekday: 'short' })
                return (
                  <div key={date} title={`${dayName} ${date}${hasWorkout ? ' ✓' : ''}`}
                    className={`aspect-square rounded-sm ${hasWorkout ? 'bg-primary shadow-[0_0_3px_rgba(0,212,255,0.3)]' : 'bg-white/5'} ${isToday ? 'ring-1 ring-primary/50' : ''}`}
                  />
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary mr-1" />Workout</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-white/5 mr-1" />Rest</span>
              <span>Current: {stats.currentStreak}d &middot; Best: {stats.longestStreak}d</span>
            </div>
          </Card>
        )}

        {expandedStat === 'week' && (
          <Card className="animate-fade-in border-accent/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary">Workouts Per Week</h3>
              <button onClick={() => setExpandedStat(null)} className="text-text-muted"><FiChevronUp size={14} /></button>
            </div>
            {weekKeys.length > 1 ? (
              <div className="h-40">
                <Bar data={{
                  labels: weekKeys,
                  datasets: [{ data: workoutsPerWeek, backgroundColor: 'rgba(168,85,247,0.4)', borderColor: '#a855f7', borderWidth: 2, borderRadius: 6 }],
                }} options={CHART_OPTIONS} />
              </div>
            ) : (
              <p className="text-text-muted text-sm text-center py-6">Complete more workouts to see your weekly trend.</p>
            )}
            {thisWeekLogs.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs text-text-muted">This week:</p>
                {thisWeekLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{log.planName}</span>
                    <span className="text-xs text-text-muted">{new Date(log.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {expandedStat === 'volume' && (
          <Card className="animate-fade-in border-success/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary">Weekly Volume (kg)</h3>
              <button onClick={() => setExpandedStat(null)} className="text-text-muted"><FiChevronUp size={14} /></button>
            </div>
            {weekKeys.length > 1 ? (
              <div className="h-40">
                <Bar data={{
                  labels: weekKeys,
                  datasets: [{ data: volumePerWeek, backgroundColor: 'rgba(34,197,94,0.3)', borderColor: '#22c55e', borderWidth: 2, borderRadius: 6 }],
                }} options={CHART_OPTIONS} />
              </div>
            ) : (
              <p className="text-text-muted text-sm text-center py-6">Complete more workouts to see your volume trend.</p>
            )}
            {volumePerWeek.length > 1 && (
              <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                <span>This week: {weeklyVolume > 1000 ? `${(weeklyVolume / 1000).toFixed(1)}t` : `${weeklyVolume}kg`}</span>
                {volumePerWeek.length >= 2 && (() => {
                  const prev = volumePerWeek[volumePerWeek.length - 2]
                  const curr = volumePerWeek[volumePerWeek.length - 1]
                  const diff = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0
                  return diff !== 0 ? (
                    <span className={diff > 0 ? 'text-success' : 'text-danger'}>
                      {diff > 0 ? '↑' : '↓'} {Math.abs(diff)}% vs last week
                    </span>
                  ) : null
                })()}
              </div>
            )}
          </Card>
        )}

        {expandedStat === 'total' && (
          <Card className="animate-fade-in border-warning/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary">Workout History</h3>
              <button onClick={() => setExpandedStat(null)} className="text-text-muted"><FiChevronUp size={14} /></button>
            </div>
            {weekKeys.length > 1 ? (
              <div className="h-40">
                <Line data={{
                  labels: weekKeys,
                  datasets: [{
                    data: workoutsPerWeek.reduce((acc: number[], val) => {
                      acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + val)
                      return acc
                    }, []),
                    borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',
                    fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: '#f59e0b',
                  }],
                }} options={CHART_OPTIONS} />
              </div>
            ) : (
              <p className="text-text-muted text-sm text-center py-6">Complete more workouts to see your cumulative progress.</p>
            )}
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-text-primary">{stats.totalWorkouts}</p>
                <p className="text-xs text-text-muted">Total</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{stats.completedWorkouts}</p>
                <p className="text-xs text-text-muted">Completed</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{stats.totalWorkouts > 0 ? Math.round((stats.completedWorkouts / stats.totalWorkouts) * 100) : 0}%</p>
                <p className="text-xs text-text-muted">Completion</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Refresh Banner */}
      {shouldSuggestRefresh() && (
        <Card className="border-accent/30 bg-accent/5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <FiRefreshCw className="text-accent text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Time to Switch It Up!</h3>
                <p className="text-sm text-text-secondary">Fresh exercises keep progress moving.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={snoozeRefresh}>Later</Button>
              <Link href="/get-started">
                <Button variant="primary" size="sm"><FiRefreshCw /> Refresh</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Start */}
      {plans.length > 0 && !currentWorkout && (
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.slice(0, 3).map(plan => (
              <Card key={plan.id} variant="interactive" padding="md">
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="font-semibold text-text-primary">{plan.name}</h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{plan.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{plan.exercises.length} exercises</Badge>
                      {plan.isPreMade && <Badge variant="accent">Template</Badge>}
                    </div>
                    <Button variant="primary" size="sm" onClick={() => {
                      startWorkout(plan.id, plan.name)
                      router.push('/workout')
                    }}>
                      <FiPlay /> Start
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-text-primary">Recent Activity</h2>
            <Link href="/history" className="text-sm text-primary hover:text-primary-light transition-colors">
              View all <FiArrowRight className="inline" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentLogs.map(log => {
              const totalSets = log.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
              const totalVolume = log.exercises.reduce((sum, ex) =>
                sum + ex.sets.reduce((s, set) => s + ((set.weight || 0) * (set.reps || 0)), 0), 0)

              return (
                <Card key={log.id} padding="sm" className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                        <FiAward className="text-success" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary text-sm">{log.planName}</h4>
                        <p className="text-xs text-text-muted">
                          {new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' '}&middot;{' '}{log.exercises.length} exercises &middot; {totalSets} sets
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-text-primary">
                        {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
                      </span>
                      <p className="text-xs text-text-muted">volume</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {plans.length === 0 && recentLogs.length === 0 && (
        <Card className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-gradient-mixed flex items-center justify-center mx-auto mb-6">
            <FiCompass className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Ready to start?</h2>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Take our 3-minute quiz and we&apos;ll build a personalised workout plan for you.
          </p>
          <Link href="/get-started">
            <Button variant="primary" size="lg"><FiCompass /> Build My Plan</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
