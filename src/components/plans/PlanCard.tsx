'use client'

import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { WorkoutPlan } from '../../store/workoutStore'
import { FiPlay, FiTrash2, FiChevronDown, FiChevronUp, FiEdit2 } from 'react-icons/fi'
import Link from 'next/link'
import { isTimedExercise } from '../../lib/exerciseUtils'

interface PlanCardProps {
  plan: WorkoutPlan
  onStart: () => void
  onDelete: () => void
}

export function PlanCard({ plan, onStart, onDelete }: PlanCardProps) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <Card variant="interactive" padding="none" className="overflow-hidden">
      {/* Gradient top accent */}
      <div className="h-1 bg-gradient-mixed" />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-display font-bold text-text-primary text-lg">{plan.name}</h3>
            {plan.description && (
              <p className="text-sm text-text-secondary mt-1 line-clamp-2">{plan.description}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="primary">{plan.exercises.length} exercises</Badge>
          {plan.isPreMade && <Badge variant="accent">Template</Badge>}
          {plan.exercises.length > 0 && (
            <Badge variant="neutral">
              ~{plan.exercises.reduce((sum, ex) => {
                const isTimed = isTimedExercise(ex.name)
                const volume = typeof ex.sets === 'number' ? (isTimed ? ex.sets * ex.reps : ex.sets) : (isTimed ? 90 : 3)
                return sum + volume
              }, 0)} {plan.exercises.some(ex => isTimedExercise(ex.name)) ? 'seconds total' : 'sets'}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="primary" size="sm" onClick={onStart} className="flex-1 min-w-[80px]">
            <FiPlay /> Start
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex-1 min-w-[100px]"
          >
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
            {expanded ? 'Hide' : 'Preview'}
          </Button>
          <Link href={`/plans/${plan.id}`}>
            <Button variant="ghost" size="sm" aria-label="Edit plan"><FiEdit2 /></Button>
          </Link>
          {!plan.isPreMade && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-danger hover:text-danger">
              <FiTrash2 />
            </Button>
          )}
        </div>

        {/* Expanded exercise list */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
            <div className="space-y-3">
              {plan.exercises.map((ex, i) => {
                const isTimed = isTimedExercise(ex.name)
                const repsDisplay = isTimed ? `${ex.reps}s` : ex.reps
                const totalDisplay = isTimed
                  ? `${ex.sets * ex.reps}s total`
                  : `${typeof ex.sets === 'number' && typeof ex.reps === 'number' ? ex.sets * ex.reps : '?'} total`

                return (
                  <div key={ex.id || i} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-medium text-sm">{i + 1}. {ex.name}</p>
                      {ex.notes && (
                        <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{ex.notes}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-primary font-bold text-sm">{ex.sets} × {repsDisplay}</p>
                      <p className="text-text-muted text-xs">{totalDisplay}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
