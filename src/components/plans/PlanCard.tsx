'use client'

import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { WorkoutPlan } from '../../store/workoutStore'
import { FiPlay, FiTrash2, FiChevronDown, FiChevronUp, FiEdit2 } from 'react-icons/fi'
import Link from 'next/link'

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
              ~{plan.exercises.reduce((sum, ex) => sum + (typeof ex.sets === 'number' ? ex.sets : 3), 0)} sets
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={onStart} className="flex-1">
            <FiPlay /> Start
          </Button>
          <Link href={`/plans/${plan.id}`}>
            <Button variant="ghost" size="sm" aria-label="Edit plan"><FiEdit2 /></Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Hide exercises' : 'Show exercises'}>
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
          </Button>
          {!plan.isPreMade && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-danger hover:text-danger">
              <FiTrash2 />
            </Button>
          )}
        </div>

        {/* Expanded exercise list */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2 animate-fade-in">
            {plan.exercises.map((ex, i) => (
              <div key={ex.id || i} className="flex items-center justify-between text-sm py-1">
                <span className="text-text-secondary">{ex.name}</span>
                <span className="text-text-muted text-xs">
                  {ex.sets} x {ex.reps}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
