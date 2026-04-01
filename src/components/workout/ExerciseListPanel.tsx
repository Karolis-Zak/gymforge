'use client'

import React from 'react'
import { findExerciseInfo, isBodyweightExercise } from '../../lib/exerciseUtils'
import type { WorkoutLog } from '../../store/workoutLogStore'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { FiCheck, FiChevronDown, FiChevronUp, FiVideo, FiExternalLink } from 'react-icons/fi'
import { Button } from '../ui/Button'

interface ExerciseListPanelProps {
  currentWorkout: WorkoutLog
  currentExerciseId: string | undefined
  collapsedExercises: Record<string, boolean>
  onToggleCollapse: (exerciseId: string, collapsed: boolean) => void
  getPB: (exerciseId: string) => number | null
  onShowGuide: (exerciseId: string) => void
}

export function ExerciseListPanel({
  currentWorkout,
  currentExerciseId,
  collapsedExercises,
  onToggleCollapse,
  getPB,
  onShowGuide,
}: ExerciseListPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">All Exercises</h3>
      {currentWorkout.exercises.map(exercise => {
        const allSetsDone = exercise.sets.every(s => s.completed)
        const isCollapsed = collapsedExercises[exercise.id] !== false
        const isCurrent = currentExerciseId === exercise.id
        const pb = getPB(exercise.exerciseId)
        const sessionMax = Math.max(...exercise.sets.map(s => s.weight || 0))
        const isNewPB = pb && sessionMax > pb
        const setsCompleted = exercise.sets.filter(s => s.completed).length
        const exerciseInfo = findExerciseInfo(exercise.exerciseName)
        const isBW = isBodyweightExercise(exercise.exerciseName)

        // Compact collapsed view
        if (isCollapsed && !isCurrent) {
          return (
            <div
              key={exercise.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                allSetsDone
                  ? 'bg-success/5 border-success/10 opacity-60'
                  : 'bg-background-card border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  allSetsDone ? 'bg-success/20' : 'bg-white/5'
                }`}>
                  {allSetsDone ? <FiCheck className="text-success" /> : <span className="text-xs text-text-muted">{setsCompleted}/{exercise.sets.length}</span>}
                </div>
                <span className={`font-medium ${allSetsDone ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                  {exercise.exerciseName}
                </span>
                {isNewPB && <Badge variant="danger" size="sm">New PB!</Badge>}
              </div>
              <button
                onClick={() => onToggleCollapse(exercise.id, false)}
                className="text-text-muted hover:text-text-secondary transition-colors p-1"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
          )
        }

        // Expanded view (for non-current exercises)
        if (!isCurrent) {
          return (
            <Card key={exercise.id} padding="md" className={allSetsDone ? 'opacity-60' : ''}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-text-primary">{exercise.exerciseName}</h4>
                  {allSetsDone && <FiCheck className="text-success" />}
                  {isNewPB && <Badge variant="danger" size="sm">New PB!</Badge>}
                  {pb && !isBW && <span className="text-xs text-text-muted">PB: {pb}kg</span>}
                </div>
                <button
                  onClick={() => onToggleCollapse(exercise.id, true)}
                  className="text-text-muted hover:text-text-secondary transition-colors p-1"
                >
                  <FiChevronUp size={16} />
                </button>
              </div>

              {exerciseInfo && (
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="primary" size="sm">{exerciseInfo.primaryMuscle}</Badge>
                  <Badge variant="neutral" size="sm">{exerciseInfo.equipment}</Badge>
                </div>
              )}

              {/* Sets list */}
              <div className="space-y-2">
                {exercise.sets.map((set, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white/[0.02] rounded-lg text-sm">
                    <span className="text-text-secondary">Set {idx + 1}</span>
                    <span className="text-text-primary">{set.reps} × {set.weight || '—'}kg{set.completed ? ' ✓' : ''}</span>
                  </div>
                ))}
              </div>

              {/* Quick buttons */}
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" onClick={() => onShowGuide(exercise.id)} className="flex-1">
                  <FiVideo /> Guide
                </Button>
              </div>
            </Card>
          )
        }

        return null
      })}
    </div>
  )
}
