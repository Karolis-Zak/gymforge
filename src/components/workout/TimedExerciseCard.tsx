'use client'

import React, { useState, useEffect } from 'react'
import { ProgressRing } from '../ui/ProgressRing'
import { FiCheck } from 'react-icons/fi'
import { TIMED_EXERCISE_DEFAULTS } from '../../lib/exerciseUtils'

interface TimedExerciseCardProps {
  exerciseName: string
  currentSetIdx: number
  totalSets: number
  duration: number
  onUpdateDuration: (duration: number) => void
  onCompleteSet: () => void
}

type TimerState = 'prep-countdown' | 'holding' | 'complete'

export function TimedExerciseCard({
  exerciseName,
  currentSetIdx,
  totalSets,
  duration,
  onUpdateDuration,
  onCompleteSet,
}: TimedExerciseCardProps) {
  const [timerState, setTimerState] = useState<TimerState>('prep-countdown')
  const [prepCountdown, setPrepCountdown] = useState(5)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const remainingSeconds = duration - elapsedSeconds

  // Prep countdown timer (5 seconds before hold starts)
  useEffect(() => {
    if (timerState !== 'prep-countdown') return

    if (prepCountdown <= 0) {
      setTimerState('holding')
      return
    }

    const interval = setInterval(() => {
      setPrepCountdown(prev => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState, prepCountdown])

  // Hold timer (counts up to duration)
  useEffect(() => {
    if (timerState !== 'holding') return

    if (elapsedSeconds >= duration) {
      setTimerState('complete')
      return
    }

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState, elapsedSeconds, duration])

  const displayValue = timerState === 'prep-countdown' ? prepCountdown : remainingSeconds
  const displayLabel = timerState === 'prep-countdown' ? 'Get Ready' : 'Hold'
  const isCountingDown = timerState === 'holding'

  return (
    <div className="flex flex-col items-center py-8">
      <p className="text-sm text-text-muted uppercase tracking-wider mb-2">{exerciseName}</p>
      <p className="text-text-secondary text-sm mb-6">Set {currentSetIdx + 1} of {totalSets}</p>

      {/* Visual timer with progress ring */}
      <ProgressRing
        value={timerState === 'prep-countdown' ? 5 - prepCountdown : elapsedSeconds}
        max={timerState === 'prep-countdown' ? 5 : duration}
        size={200}
        strokeWidth={12}
        color={timerState === 'prep-countdown' ? '#fbbf24' : '#00d4ff'}
      >
        <span className={`text-6xl font-display font-bold ${
          timerState === 'prep-countdown' ? 'text-warning' :
          timerState === 'holding' ? 'text-primary' :
          'text-success'
        }`}>
          {displayValue}
        </span>
        <span className="text-xs text-text-muted mt-2">{timerState === 'complete' ? 'Complete!' : 'seconds'}</span>
      </ProgressRing>

      <p className={`text-text-secondary mt-8 mb-4 text-center ${
        timerState === 'prep-countdown' ? 'text-warning font-bold' :
        timerState === 'holding' ? 'text-primary' :
        'text-success'
      }`}>
        {timerState === 'prep-countdown' ? 'Get ready... hold strong!' :
         timerState === 'holding' ? 'Keep going! You\'ve got this!' :
         'Set complete! Great work!'}
      </p>

      {/* Duration adjustment controls (only during prep) */}
      {timerState === 'prep-countdown' && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              if (duration > TIMED_EXERCISE_DEFAULTS.MINIMUM_SECONDS) {
                onUpdateDuration(Math.max(TIMED_EXERCISE_DEFAULTS.MINIMUM_SECONDS, duration - 5))
              }
            }}
            disabled={duration <= TIMED_EXERCISE_DEFAULTS.MINIMUM_SECONDS}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
      )}

      {/* Complete button (only show after hold is done) */}
      {timerState === 'complete' && (
        <button
          onClick={onCompleteSet}
          className="w-full max-w-sm h-16 bg-gradient-success text-white text-xl font-display font-bold rounded-2xl shadow-glow-success hover:shadow-[0_0_40px_rgba(34,197,94,0.3)] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-3"
        >
          <FiCheck className="text-2xl" /> Next Set
        </button>
      )}

      {/* Skip button during hold */}
      {timerState === 'holding' && (
        <button
          onClick={onCompleteSet}
          className="w-full max-w-sm h-12 bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary text-sm font-medium rounded-2xl transition-all"
        >
          Skip Rest (Finish Early)
        </button>
      )}
    </div>
  )
}
