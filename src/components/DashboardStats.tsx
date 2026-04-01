'use client'

import React from 'react'
import type { ExerciseLog } from '../store/workoutLogStore'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Tooltip, Filler
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { Card } from './ui/Card'
import { FiZap, FiTrendingUp, FiAward, FiClock, FiChevronUp } from 'react-icons/fi'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler)

interface DashboardStatsProps {
  stats: any
  thisWeekLogs: any[]
  weeklyVolume: number
  completedLogs: any[]
  weekKeys: string[]
  volumePerWeek: number[]
  workoutsPerWeek: number[]
  last30Days: string[]
  streakDays: Set<string>
  expandedStat: string | null
  onToggleStat: (id: string) => void
  chartOptions: any
}

export function DashboardStats({
  stats,
  thisWeekLogs,
  weeklyVolume,
  completedLogs,
  weekKeys,
  volumePerWeek,
  workoutsPerWeek,
  last30Days,
  streakDays,
  expandedStat,
  onToggleStat,
  chartOptions,
}: DashboardStatsProps) {
  // Calculate average RPE from exercises with RPE logged
  const rpeValues = completedLogs.flatMap(log =>
    log.exercises
      .filter((ex: ExerciseLog) => ex.rpe)
      .map((ex: ExerciseLog) => ex.rpe as number)
  )
  const avgRPE = rpeValues.length > 0
    ? (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1)
    : null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Current Streak */}
        <button onClick={() => onToggleStat('streak')} className="text-left">
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
        <button onClick={() => onToggleStat('week')} className="text-left">
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
        <button onClick={() => onToggleStat('volume')} className="text-left">
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
        <button onClick={() => onToggleStat('total')} className="text-left">
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

        {/* Average RPE */}
        {avgRPE && (
          <button onClick={() => onToggleStat('rpe')} className="text-left hidden lg:block">
            <Card className={`transition-all ${expandedStat === 'rpe' ? 'border-accent/30' : ''}`} padding="sm">
              <div className="p-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Avg RPE</span>
                  <FiZap className="text-accent text-sm" />
                </div>
                <div className="text-2xl font-bold font-display text-accent">{avgRPE}</div>
                <div className="text-xs text-text-muted mt-0.5">effort level</div>
              </div>
            </Card>
          </button>
        )}
      </div>

      {/* Expanded Stat Detail */}
      {expandedStat === 'streak' && (
        <Card className="animate-fade-in border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary">Streak — Last 30 Days</h3>
            <button onClick={() => onToggleStat('')} className="text-text-muted" aria-label="Collapse"><FiChevronUp size={14} /></button>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1">
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
            <button onClick={() => onToggleStat('')} className="text-text-muted" aria-label="Collapse"><FiChevronUp size={14} /></button>
          </div>
          {weekKeys.length > 1 ? (
            <div className="h-40">
              <Bar data={{
                labels: weekKeys,
                datasets: [{ data: workoutsPerWeek, backgroundColor: 'rgba(168,85,247,0.4)', borderColor: '#a855f7', borderWidth: 2, borderRadius: 6 }],
              }} options={chartOptions} />
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
            <button onClick={() => onToggleStat('')} className="text-text-muted" aria-label="Collapse"><FiChevronUp size={14} /></button>
          </div>
          {weekKeys.length > 1 ? (
            <div className="h-40">
              <Bar data={{
                labels: weekKeys,
                datasets: [{ data: volumePerWeek, backgroundColor: 'rgba(34,197,94,0.3)', borderColor: '#22c55e', borderWidth: 2, borderRadius: 6 }],
              }} options={chartOptions} />
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
            <button onClick={() => onToggleStat('')} className="text-text-muted" aria-label="Collapse"><FiChevronUp size={14} /></button>
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
              }} options={chartOptions} />
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

      {expandedStat === 'rpe' && avgRPE && (
        <Card className="animate-fade-in border-accent/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary">Average Effort (RPE)</h3>
            <button onClick={() => onToggleStat('')} className="text-text-muted" aria-label="Collapse"><FiChevronUp size={14} /></button>
          </div>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="text-4xl font-bold font-display text-accent">{avgRPE}</div>
              <div className="text-text-muted">/ 10</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm text-text-secondary">
                {Number(avgRPE) <= 5 ? '✓ Controlled effort — good recovery between sessions' :
                 Number(avgRPE) <= 7 ? '✓ Good balance of intensity and sustainability' :
                 '💪 Pushing hard — ensure adequate rest and recovery'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="text-xs text-text-muted mb-1">Total Exercises</p>
                <p className="font-bold text-text-primary">{rpeValues.length}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Min RPE</p>
                <p className="font-bold text-text-primary">{Math.min(...rpeValues)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Max RPE</p>
                <p className="font-bold text-text-primary">{Math.max(...rpeValues)}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
