'use client'

import React from 'react'
import { REST_ADJUSTMENTS } from '../../lib/exerciseUtils'
import { ProgressRing } from '../ui/ProgressRing'
import { Button } from '../ui/Button'
import { FiSkipForward } from 'react-icons/fi'

interface RestTimerCardProps {
  exerciseId: string
  currentSetIdx: number
  totalSets: number
  restTime: number
  defaultRestSeconds: number
  onAdjustRest: (exerciseId: string, delta: number) => void
  onSkipRest: (exerciseId: string) => void
}

export function RestTimerCard({
  exerciseId,
  currentSetIdx,
  totalSets,
  restTime,
  defaultRestSeconds,
  onAdjustRest,
  onSkipRest,
}: RestTimerCardProps) {
  return (
    <div className="flex flex-col items-center py-8">
      <p className="text-sm text-text-muted uppercase tracking-wider mb-2">Rest Between Sets</p>
      <p className="text-text-secondary text-sm mb-6">Next: Set {currentSetIdx + 1} of {totalSets}</p>
      <ProgressRing value={restTime} max={Math.max(restTime + 10, defaultRestSeconds)} size={180} strokeWidth={10} color="#00d4ff">
        <span className="text-5xl font-display font-bold text-primary">{restTime}</span>
        <span className="text-xs text-text-muted mt-1">seconds</span>
      </ProgressRing>
      <p className="text-text-secondary mt-6 mb-2">Breathe and recover.</p>
      {/* Rest time controls */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => onAdjustRest(exerciseId, -REST_ADJUSTMENTS.DECREASE)}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary transition-all">
          -{REST_ADJUSTMENTS.DECREASE}s
        </button>
        <button onClick={() => onAdjustRest(exerciseId, REST_ADJUSTMENTS.INCREASE_SHORT)}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary transition-all">
          +{REST_ADJUSTMENTS.INCREASE_SHORT}s
        </button>
        <button onClick={() => onAdjustRest(exerciseId, REST_ADJUSTMENTS.INCREASE_LONG)}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary transition-all">
          +{REST_ADJUSTMENTS.INCREASE_LONG}s
        </button>
      </div>
      <Button variant="primary" size="md" onClick={() => onSkipRest(exerciseId)}>
        <FiSkipForward /> Skip Rest
      </Button>
    </div>
  )
}
