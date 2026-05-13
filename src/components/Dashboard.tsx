'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserStore } from '../store/userStore'
import { useWorkoutLogStore } from '../store/workoutLogStore'
import type { WorkoutLog } from '../store/workoutLogStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useOnboardingStore } from '../store/onboardingStore'
import { calculateVolume, getProgressionSuggestion, findExerciseInfo } from '../lib/exerciseUtils'
import { BASE_CHART_OPTIONS } from '../lib/chartOptions'
import { Card, Button, Badge } from './ui'
import { FiAward, FiPlay, FiArrowRight, FiCompass, FiTrendingUp, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import { DashboardStats } from './DashboardStats'
import { RecoveryTracker } from './RecoveryTracker'
import { QuickRepeatWorkout } from './QuickRepeatWorkout'

const CHART_OPTIONS = {
  ...BASE_CHART_OPTIONS,
  plugins: { ...BASE_CHART_OPTIONS.plugins, tooltip: { enabled: true } },
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
  const { plans } = useWorkoutStore()
  const { answers } = useOnboardingStore()
  const stats = getWorkoutStats()
  const [expandedStat, setExpandedStat] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  React.useEffect(() => {
    setHydrated(true)
  }, [])

  const completedLogs = useMemo(() => logs.filter(l => l.completed), [logs])
  const recentLogs = useMemo(() => [...completedLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5), [completedLogs])

  // Weekly data
  const weekStart = useMemo(() => {
    const now = new Date()
    const ws = new Date(now)
    ws.setDate(now.getDate() - now.getDay())
    ws.setHours(0, 0, 0, 0)
    return ws
  }, [])

  const thisWeekLogs = useMemo(() =>
    completedLogs.filter(l => new Date(l.date) >= weekStart),
    [completedLogs, weekStart])
  const weeklyVolume = useMemo(() =>
    thisWeekLogs.reduce((total, log) =>
      total + calculateVolume(log.exercises), 0),
    [thisWeekLogs])

  // Chart data for last 8 weeks
  const { weeks, weekKeys, volumePerWeek, workoutsPerWeek } = useMemo(() => {
    const w = groupByWeek(completedLogs)
    const wk = Object.keys(w).sort().slice(-8)
    const vw = wk.map(week =>
      w[week].reduce((sum, log) =>
        sum + calculateVolume(log.exercises), 0))
    const wpw = wk.map(week => w[week].length)
    return { weeks: w, weekKeys: wk, volumePerWeek: vw, workoutsPerWeek: wpw }
  }, [completedLogs])

  // Streak history — last 30 days
  const last30Days = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000)
    return d.toISOString().split('T')[0]
  }), [])

  const streakDays = useMemo(() =>
    new Set(completedLogs.map(l => l.date.split('T')[0])),
    [completedLogs])

  const userName = profile?.name || 'Athlete'
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const toggleStat = (id: string) => setExpandedStat(prev => prev === id ? null : id)

  // Dynamic greeting based on actual performance
  const getGreeting = (): string => {
    if (completedLogs.length === 0) return "Let's get started!"

    // Volume trend
    const volumeUp = volumePerWeek.length >= 2 && volumePerWeek[volumePerWeek.length - 1] > volumePerWeek[volumePerWeek.length - 2]
    const volumeDown = volumePerWeek.length >= 2 && volumePerWeek[volumePerWeek.length - 1] < volumePerWeek[volumePerWeek.length - 2] * 0.8

    // Streak status
    const onFire = stats.currentStreak >= 5
    const slacking = stats.currentStreak === 0 && completedLogs.length > 3

    // Milestones
    if (stats.completedWorkouts === 10) return "10 workouts done! You're officially hooked."
    if (stats.completedWorkouts === 25) return "25 workouts! You're a machine."
    if (stats.completedWorkouts === 50) return "50 workouts. Legend status unlocked."
    if (stats.completedWorkouts === 100) return "100 workouts. We bow to your dedication."

    if (onFire && volumeUp) return "You're on fire — volume up AND streak going strong!"
    if (onFire) return `${stats.currentStreak} days straight? Someone call the fire department.`
    if (volumeUp) return "Volume's climbing — the gains are coming."
    if (volumeDown) return "Volume dropped — rest week or time to push harder?"
    if (slacking) return "Haven't seen you in a while... the weights miss you."
    if (thisWeekLogs.length >= 4) return "4+ sessions this week? Absolute animal."
    if (thisWeekLogs.length >= 2) return "Good consistency this week. Keep it going."
    if (stats.currentStreak >= 3) return "3-day streak — don't break the chain!"

    return "Let's crush it today."
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">
            Welcome back, <span className="gradient-text">{hydrated ? userName : 'Athlete'}</span>
          </h1>
          <p className="text-text-secondary mt-1">{hydrated ? getGreeting() : "Let's get started!"}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-mixed flex items-center justify-center">
          <span className="text-white font-bold text-sm">{hydrated ? initials : 'AT'}</span>
        </div>
      </div>

      {/* Active Workout Banner */}
      {hydrated && currentWorkout && (
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

      {/* Quick Repeat Last Workout */}
      {hydrated && !currentWorkout && <QuickRepeatWorkout />}

      {/* Workout Status — gated on hydration so SSR/CSR markup matches */}
      {hydrated && (() => {
        const plannedWorkoutsThisWeek = plans.length > 0 ? answers?.daysPerWeek || 3 : 0
        if (plannedWorkoutsThisWeek === 0) return null

        const dayOfWeek = new Date().getDay()
        // Expected pace: roughly proportional to days elapsed (Sun=0 → 1/7 by Mon end)
        const expectedWorkoutsByNow = Math.floor(plannedWorkoutsThisWeek * (dayOfWeek / 7))
        const workoutsRemaining = Math.max(0, plannedWorkoutsThisWeek - thisWeekLogs.length)

        // Three states:
        //  - none done yet → neutral "Get started" prompt (no false "on track")
        //  - done >= expected and at least one logged → success "On Track"
        //  - otherwise → warning "Behind Schedule"
        const noneLogged = thisWeekLogs.length === 0
        const onTrack = !noneLogged && thisWeekLogs.length >= expectedWorkoutsByNow
        const tone: 'neutral' | 'success' | 'warning' =
          noneLogged ? 'neutral' : onTrack ? 'success' : 'warning'

        const border =
          tone === 'success' ? 'border-success/20 bg-success/5'
          : tone === 'warning' ? 'border-warning/20 bg-warning/5'
          : 'border-white/10 bg-white/[0.02]'
        const iconBg =
          tone === 'success' ? 'bg-success/20'
          : tone === 'warning' ? 'bg-warning/20'
          : 'bg-primary/15'
        const icon =
          tone === 'success' ? <FiCheckCircle className="text-success text-lg" />
          : tone === 'warning' ? <FiAlertCircle className="text-warning text-lg" />
          : <FiPlay className="text-primary text-lg" />
        const heading =
          tone === 'success' ? 'On Track'
          : tone === 'warning' ? 'Behind Schedule'
          : 'Get your first workout in'
        const barColor =
          tone === 'success' ? 'bg-success'
          : tone === 'warning' ? 'bg-warning'
          : 'bg-primary/40'

        return (
          <Card className={border}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                {icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">{heading}</h3>
                <p className="text-sm text-text-secondary mt-1">
                  {thisWeekLogs.length}/{plannedWorkoutsThisWeek} workouts this week
                  {workoutsRemaining > 0 && ` • ${workoutsRemaining} remaining`}
                </p>
                <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${Math.min(100, (thisWeekLogs.length / plannedWorkoutsThisWeek) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )
      })()}

      {/* Interactive Stats Grid — gated on hydration so SSR/CSR markup matches */}
      {hydrated && (
        <DashboardStats
          stats={stats}
          thisWeekLogs={thisWeekLogs}
          weeklyVolume={weeklyVolume}
          completedLogs={completedLogs}
          weekKeys={weekKeys}
          volumePerWeek={volumePerWeek}
          workoutsPerWeek={workoutsPerWeek}
          last30Days={last30Days}
          streakDays={streakDays}
          expandedStat={expandedStat}
          onToggleStat={toggleStat}
          chartOptions={CHART_OPTIONS}
        />
      )}

      {/* Quick Start */}
      {hydrated && plans.length > 0 && !currentWorkout && (
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

      {/* Weekly Volume Targets — gated on hydration */}
      {hydrated && (() => {
        // Calculate sets per muscle this week
        const muscleSetCounts: Record<string, number> = {}
        const targetSetsPerMuscle = 10 // Optimal 8-12, aiming for 10

        thisWeekLogs.forEach(log => {
          log.exercises.forEach(ex => {
            const exerciseInfo = findExerciseInfo(ex.exerciseName)
            if (exerciseInfo) {
              const muscles = [exerciseInfo.primaryMuscle, ...exerciseInfo.secondaryMuscles]
              const setsPerMuscle = Math.ceil(ex.sets.length / muscles.length)
              muscles.forEach(m => {
                muscleSetCounts[m] = (muscleSetCounts[m] || 0) + setsPerMuscle
              })
            }
          })
        })

        const majorMuscles = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps']
        const muscleProgress = majorMuscles
          .filter(m => muscleSetCounts[m] !== undefined || thisWeekLogs.length > 0)
          .map(m => ({
            muscle: m,
            sets: muscleSetCounts[m] || 0,
            target: targetSetsPerMuscle,
            pct: Math.min(100, ((muscleSetCounts[m] || 0) / targetSetsPerMuscle) * 100)
          }))
          .filter(m => m.sets > 0 || m.pct > 0)

        if (muscleProgress.length > 0) {
          return (
            <div>
              <h2 className="text-xl font-display font-bold text-text-primary mb-4">Weekly Volume by Muscle</h2>
              <Card padding="md">
                <div className="space-y-3">
                  {muscleProgress.map(m => (
                    <div key={m.muscle}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text-primary capitalize">{m.muscle}</span>
                        <span className={`text-xs font-bold ${m.pct >= 100 ? 'text-success' : m.pct >= 70 ? 'text-warning' : 'text-text-muted'}`}>
                          {m.sets}/{m.target} sets
                        </span>
                      </div>
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            m.pct >= 100 ? 'bg-success' :
                            m.pct >= 70 ? 'bg-warning' :
                            'bg-primary/40'
                          }`}
                          style={{ width: `${Math.min(m.pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-4">Target: 8-12 sets per muscle per week. Adjust exercises if imbalanced.</p>
              </Card>
            </div>
          )
        }
        return null
      })()}

      {/* Progression Suggestions (from RPE feedback) — gated on hydration */}
      {hydrated && (() => {
        const suggestions: Array<{ exerciseName: string; currentWeight: number; rpes: number[]; suggestion: { suggestion: string; nextWeight: number; reason: string } }> = []

        // Group exercises by name across last 5 workouts
        const exerciseGroups: Record<string, { rpes: number[]; weights: number[] }> = {}
        completedLogs.slice(0, 5).forEach(log => {
          log.exercises.forEach(ex => {
            if (!exerciseGroups[ex.exerciseName]) {
              exerciseGroups[ex.exerciseName] = { rpes: [], weights: [] }
            }
            if (ex.rpe) exerciseGroups[ex.exerciseName].rpes.push(ex.rpe)
            const weight = Math.max(...ex.sets.map(s => s.weight || 0))
            if (weight > 0) exerciseGroups[ex.exerciseName].weights.push(weight)
          })
        })

        // Find exercises with 3+ RPE logs and consistent weight
        Object.entries(exerciseGroups).forEach(([name, data]) => {
          if (data.rpes.length >= 3 && data.weights.length > 0) {
            const currentWeight = data.weights[data.weights.length - 1]
            const suggestion = getProgressionSuggestion(name, data.rpes.slice(-3), 7, currentWeight)
            if (suggestion.suggestion !== 'maintain') {
              suggestions.push({ exerciseName: name, currentWeight, rpes: data.rpes.slice(-3), suggestion })
            }
          }
        })

        if (suggestions.length > 0) {
          return (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
                  <FiTrendingUp className="text-accent" /> Progression Suggestions
                </h2>
              </div>
              <div className="space-y-3">
                {suggestions.map((item) => (
                  <Card key={item.exerciseName} padding="md" className={item.suggestion.suggestion === 'increase' ? 'border-success/20' : 'border-warning/20'}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary mb-1">{item.exerciseName}</h3>
                        <p className="text-sm text-text-secondary mb-2">{item.suggestion.reason}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.suggestion.suggestion === 'increase' ? 'success' : 'warning'} size="sm">
                            {item.suggestion.suggestion === 'increase' ? '↑' : '↓'} {item.suggestion.nextWeight}kg
                          </Badge>
                          <span className="text-xs text-text-muted">
                            from {item.currentWeight}kg • RPE {item.rpes.map(r => r.toFixed(1)).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* Recent Activity — gated on hydration */}
      {hydrated && recentLogs.length > 0 && (
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

      {/* Recovery Tracker — gated on hydration (reads recoveryStore) */}
      {hydrated && <RecoveryTracker />}

      {/* Empty State — gated on hydration (depends on stored plans/logs) */}
      {hydrated && plans.length === 0 && recentLogs.length === 0 && (
        <Card className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-gradient-mixed flex items-center justify-center mx-auto mb-6">
            <FiCompass className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-2">Ready to start?</h2>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Take our 3-minute quiz and we&apos;ll build a personalized workout plan for you.
          </p>
          <Link href="/get-started">
            <Button variant="primary" size="lg"><FiCompass /> Build My Plan</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
