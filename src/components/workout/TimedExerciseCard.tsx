'use client'

import React from 'react'
import { ProgressRing } from '../ui/ProgressRing'
import { FiCheck } from 'react-icons/fi'

interface TimedExerciseCardProps {
  exerciseName: string
  currentSetIdx: number
  totalSets: number
  duration: number
  onUpdateDuration: (duration: number) => void
  onCompleteSet: () => void
}

export function TimedExerciseCard({
  exerciseName,
  currentSetIdx,
  totalSets,
  duration,
  onUpdateDuration,
  onCompleteSet,
}: TimedExerciseCardProps) {
  return (
    <div className="flex flex-col items-center py-8">
      <p className="text-sm text-text-muted uppercase tracking-wider mb-2">{exerciseName}</p>
      <p className="text-text-secondary text-sm mb-6">Set {currentSetIdx + 1} of {totalSets}</p>

      {/* Visual timer with progress ring */}
      <ProgressRing value={duration} max={Math.max(duration, 30)} size={200} strokeWidth={12} color="#00d4ff">
        <span className="text-6xl font-display font-bold text-primary">{duration}</span>
        <span className="text-xs text-text-muted mt-2">seconds</span>
      </ProgressRing>

      <p className="text-text-secondary mt-8 mb-4">Hold strong. You've got this.</p>

      {/* Duration adjustment controls */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            if (duration > 5) onUpdateDuration(duration - 5)
          }}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary transition-all"
        >
          -5s
        </button>
        <button
          onClick={() => onUpdateDuration(duration + 5)}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary transition-all"
        >
          +5s
        </button>
        <button
          onClick={() => onUpdateDuration(duration + 30)}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary transition-all"
        >
          +30s
        </button>
      </div>

      {/* Complete button */}
      <button
        onClick={onCompleteSet}
        className="w-full max-w-sm h-16 bg-gradient-primary text-white text-xl font-display font-bold rounded-2xl shadow-glow hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-3"
      >
        <FiCheck className="text-2xl" /> Hold Complete — Next Set
      </button>
    </div>
  )
}
