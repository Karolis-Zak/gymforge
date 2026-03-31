'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserStore } from '../store/userStore'
import { useWorkoutLogStore } from '../store/workoutLogStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useOnboardingStore } from '../store/onboardingStore'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { StatCard } from './ui/StatCard'
import { Badge } from './ui/Badge'
import { FiZap, FiTrendingUp, FiAward, FiClock, FiPlay, FiArrowRight, FiRefreshCw, FiCompass } from 'react-icons/fi'

export function Dashboard() {
  const router = useRouter()
  const { profile } = useUserStore()
  const { currentWorkout, logs, getWorkoutStats, startWorkout } = useWorkoutLogStore()
  const { shouldSuggestRefresh, snoozeRefresh } = useOnboardingStore()
  const { plans } = useWorkoutStore()
  const stats = getWorkoutStats()

  const recentLogs = logs
    .filter(l => l.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Weekly volume
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const thisWeekLogs = logs.filter(l => l.completed && new Date(l.date) >= weekStart)
  const weeklyVolume = thisWeekLogs.reduce((total, log) =>
    total + log.exercises.reduce((exTotal, ex) =>
      exTotal + ex.sets.reduce((setTotal, set) =>
        setTotal + ((set.weight || 0) * (set.reps || 0)), 0), 0), 0)

  const userName = profile?.name || 'Athlete'
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Streak"
          value={`${stats.currentStreak}d`}
          subtitle={`Longest: ${stats.longestStreak}d`}
          icon={<FiZap />}
          color="primary"
        />
        <StatCard
          title="This Week"
          value={thisWeekLogs.length}
          subtitle="workouts"
          icon={<FiTrendingUp />}
          color="accent"
        />
        <StatCard
          title="Weekly Volume"
          value={weeklyVolume > 1000 ? `${(weeklyVolume / 1000).toFixed(1)}t` : `${weeklyVolume}kg`}
          subtitle="total lifted"
          icon={<FiAward />}
          color="success"
        />
        <StatCard
          title="Total Workouts"
          value={stats.completedWorkouts}
          subtitle="completed"
          icon={<FiClock />}
          color="warning"
        />
      </div>

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
            <Link href="/progress" className="text-sm text-primary hover:text-primary-light transition-colors">
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
