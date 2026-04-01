'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { findExerciseInfo, isBodyweightExercise, isTimedExercise } from '../../lib/exerciseUtils'
import type { WorkoutLog } from '../../store/workoutLogStore'
import { useWorkoutStore } from '../../store/workoutStore'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { FiX, FiPlay, FiChevronUp, FiChevronDown } from 'react-icons/fi'

interface WorkoutPreviewScreenProps {
  currentWorkout: WorkoutLog
  onStart: () => void
  onCancel: () => void
}

export function WorkoutPreviewScreen({ currentWorkout, onStart, onCancel }: WorkoutPreviewScreenProps) {
  const router = useRouter()
  const { updatePlan, plans } = useWorkoutStore()
  const [exercises, setExercises] = useState(currentWorkout.exercises)

  const exerciseInfo = (name: string) => findExerciseInfo(name)

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...exercises]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= newExercises.length) return
    ;[newExercises[index], newExercises[swapIdx]] = [newExercises[swapIdx], newExercises[index]]
    setExercises(newExercises)

    // Update the plan in store
    const plan = plans.find(p => p.name === currentWorkout.planName)
    if (plan) {
      const updatedExercises = plan.exercises.map(ex => {
        const newExOrder = newExercises.find(ne => ne.exerciseName === ex.name)
        return newExOrder ? { ...ex, sets: newExOrder.sets.length, reps: newExOrder.sets[0]?.reps } : ex
      })
      updatePlan(plan.id, { exercises: updatedExercises })
    }
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold text-text-primary">{currentWorkout.planName}</h1>
        <p className="text-text-secondary mt-2">
          {currentWorkout.exercises.length} exercises &middot; {currentWorkout.exercises.reduce((s, ex) => s + ex.sets.length, 0)} sets
        </p>
      </div>

      {/* Exercise overview */}
      <Card>
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Today&apos;s Exercises</h3>
        <div className="space-y-3">
          {exercises.map((ex, i) => {
            const info = exerciseInfo(ex.exerciseName)
            const isBW = isBodyweightExercise(ex.exerciseName)
            return (
              <div key={ex.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                <span className="w-7 h-7 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium">{ex.exerciseName}</p>
                  <p className="text-xs text-text-muted">
                    {ex.sets.length} sets × {ex.sets[0]?.reps || '?'} {isTimedExercise(ex.exerciseName) ? 'sec' : 'reps'}
                    {!isBW && ex.sets[0]?.weight ? ` @ ${ex.sets[0].weight}kg` : ''}
                    {info ? ` · ${info.primaryMuscle}` : ''}
                  </p>
                </div>
                {info && (
                  <Badge variant={info.difficulty === 'beginner' ? 'success' : info.difficulty === 'intermediate' ? 'warning' : 'danger'} size="sm">
                    {info.difficulty}
                  </Badge>
                )}
                {/* Move buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveExercise(i, 'up')}
                    disabled={i === 0}
                    className="text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                    aria-label="Move exercise up"
                  >
                    <FiChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMoveExercise(i, 'down')}
                    disabled={i === exercises.length - 1}
                    className="text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                    aria-label="Move exercise down"
                  >
                    <FiChevronDown size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onCancel} className="flex-1">
          <FiX /> Cancel
        </Button>
        <button
          onClick={onStart}
          className="flex-1 h-14 bg-gradient-primary text-white text-lg font-display font-bold rounded-2xl shadow-glow hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-3"
        >
          <FiPlay /> Begin Workout
        </button>
      </div>
    </div>
  )
}
