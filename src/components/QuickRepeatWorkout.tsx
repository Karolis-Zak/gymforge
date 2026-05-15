'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutLogStore } from '../store/workoutLogStore'
import { useWorkoutStore } from '../store/workoutStore'
import { calculateVolume } from '../lib/exerciseUtils'
import { Card, Button } from './ui'
import { FiRepeat, FiZap, FiCalendar, FiBarChart2 } from 'react-icons/fi'

export function QuickRepeatWorkout() {
  const router = useRouter()
  const { logs, startWorkout } = useWorkoutLogStore()
  const { plans } = useWorkoutStore()

  // Get last completed workout
  const lastWorkout = React.useMemo(() => {
    const completed = logs.filter(l => l.completed)
    return completed.length > 0 ? completed[completed.length - 1] : null
  }, [logs])

  // Format last workout date
  const lastWorkoutDate = lastWorkout
    ? new Date(lastWorkout.date).toLocaleDateString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null

  // Calculate last workout stats
  const lastWorkoutStats = React.useMemo(() => {
    if (!lastWorkout) return null
    return {
      exerciseCount: lastWorkout.exercises.length,
      volume: calculateVolume(lastWorkout.exercises),
      duration: lastWorkout.durationSeconds
        ? `${Math.floor(lastWorkout.durationSeconds / 60)}m`
        : null,
    }
  }, [lastWorkout])

  // Handle repeat workout
  const handleRepeat = React.useCallback(() => {
    if (!lastWorkout) return
    const plan = plans.find(p => p.id === lastWorkout.planId)
    if (plan) {
      startWorkout(lastWorkout.planId, lastWorkout.planName)
      router.push('/workout')
    }
  }, [lastWorkout, plans, startWorkout, router])

  // Keyboard shortcut (R key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (lastWorkout && !['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
          e.preventDefault()
          handleRepeat()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [lastWorkout, handleRepeat])

  if (!lastWorkout || !lastWorkoutStats) {
    return null
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-accent/5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-display font-bold text-text-primary mb-3">
            Quick Repeat Last Workout
          </h3>

          {/* Last Workout Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <FiCalendar className="text-primary" size={16} />
              <span>{lastWorkoutDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <FiZap className="text-accent" size={16} />
              <span>{lastWorkoutStats.exerciseCount} exercises</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <FiBarChart2 className="text-success" size={16} />
              <span>{Math.round(lastWorkoutStats.volume)}kg volume</span>
            </div>
            {lastWorkoutStats.duration && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <FiRepeat className="text-warning" size={16} />
                <span>{lastWorkoutStats.duration}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-text-muted">
            {lastWorkout.planName} • Press <kbd className="bg-white/10 px-2 py-1 rounded text-xs font-mono">R</kbd> to repeat
          </p>
        </div>

        {/* Repeat Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleRepeat}
          className="flex items-center gap-2 whitespace-nowrap w-full sm:w-auto"
        >
          <FiRepeat /> Repeat Workout
        </Button>
      </div>
    </Card>
  )
}
