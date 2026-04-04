'use client'

import React from 'react'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { FiArrowRight, FiCheck, FiRepeat, FiVideo, FiExternalLink, FiZap, FiMinus, FiPlus } from 'react-icons/fi'
import { findExerciseInfo, isBodyweightExercise, isTimedExercise, isUnilateralExercise } from '../../lib/exerciseUtils'
import { getExerciseVideoId, getExerciseSearchUrl } from '../../data/exerciseVideos'
import { TimedExerciseCard } from './TimedExerciseCard'
import type { ExerciseLog } from '../../store/workoutLogStore'

interface ExerciseFocusCardProps {
  currentExercise: ExerciseLog
  currentSetIdx: number
  exerciseInfo: any
  suggestedWeight: number | null
  isBW: boolean
  isTimed: boolean
  currentSet: any
  pb: number | null
  isNewPB: boolean
  perSideEnabled: Record<string, boolean>
  currentSide: Record<string, 'left' | 'right'>
  sideCompleted: Record<string, Record<number, { left: boolean; right: boolean }>>
  showGuide: Record<string, boolean>
  onTogglePerSide: (exerciseId: string) => void
  onSetCurrentSide: (exerciseId: string, side: 'left' | 'right') => void
  onUpdateSetWeight: (exerciseId: string, setIdx: number, weight: number) => void
  onUpdateSetReps: (exerciseId: string, setIdx: number, reps: number) => void
  onCompleteSet: (exerciseId: string, setIdx: number, completed: boolean, totalSets: number) => void
  onToggleGuide: (exerciseId: string) => void
  onSwapExercise: (exerciseId: string) => void
  onSideCompleted: (exerciseId: string, setIdx: number, side: 'left' | 'right') => void
}

export function ExerciseFocusCard({
  currentExercise,
  currentSetIdx,
  exerciseInfo,
  suggestedWeight,
  isBW,
  isTimed,
  currentSet,
  pb,
  isNewPB,
  perSideEnabled,
  currentSide,
  sideCompleted,
  showGuide,
  onTogglePerSide,
  onSetCurrentSide,
  onUpdateSetWeight,
  onUpdateSetReps,
  onCompleteSet,
  onToggleGuide,
  onSwapExercise,
  onSideCompleted,
}: ExerciseFocusCardProps) {
  const isGuideOpen = showGuide[currentExercise.id]

  return (
    <div className="flex flex-col items-center">
      {/* Exercise Name + Badges */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-display font-bold text-text-primary">{currentExercise.exerciseName}</h2>
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          {exerciseInfo && (
            <>
              <Badge variant="primary">{exerciseInfo.primaryMuscle}</Badge>
              <Badge variant="neutral">{exerciseInfo.equipment}</Badge>
              <Badge variant={exerciseInfo.difficulty === 'beginner' ? 'success' : exerciseInfo.difficulty === 'intermediate' ? 'warning' : 'danger'}>
                {exerciseInfo.difficulty}
              </Badge>
            </>
          )}
          {isNewPB && <Badge variant="danger">New PB!</Badge>}
          {pb && !isBW && <Badge variant="accent">PB: {pb}kg</Badge>}
        </div>
        <p className="text-sm text-text-muted mt-3">
          Set {currentSetIdx + 1} of {currentExercise.sets.length}
        </p>

        {/* Weight progression suggestion */}
        {suggestedWeight && !isBW && (
          <div className="mt-2 bg-success/10 border border-success/20 rounded-xl px-3 py-1.5 text-xs text-success flex items-center gap-1 justify-center">
            <FiArrowRight size={12} /> Try {suggestedWeight}kg today — you&apos;ve been consistent!
          </div>
        )}

        {/* Quick actions */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-2 border-t border-white/10">
          <button
            onClick={() => onSwapExercise(currentExercise.id)}
            className="px-5 py-2 rounded-xl text-sm font-medium text-text-primary bg-accent/10 border border-accent/30 hover:bg-accent/20 hover:border-accent/50 transition-all flex items-center gap-2"
          >
            <FiRepeat size={14} /> Swap Exercise
          </button>
        </div>
      </div>

      {/* Per-side toggle for unilateral exercises */}
      {isUnilateralExercise(currentExercise.exerciseName) && (
        <div className="mb-4 flex flex-col items-center gap-2">
          <button
            onClick={() => onTogglePerSide(currentExercise.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              perSideEnabled[currentExercise.id]
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10'
            }`}
          >
            {perSideEnabled[currentExercise.id] ? '✓ Per-side mode ON' : 'Track each side separately'}
          </button>

          {perSideEnabled[currentExercise.id] && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSetCurrentSide(currentExercise.id, 'right')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  currentSide[currentExercise.id] === 'right'
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-glow'
                    : 'bg-white/5 text-text-muted border border-white/10'
                }`}
              >
                Right
                {sideCompleted[currentExercise.id]?.[currentSetIdx]?.right && (
                  <FiCheck className="inline ml-1 text-success" />
                )}
              </button>
              <button
                onClick={() => onSetCurrentSide(currentExercise.id, 'left')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  currentSide[currentExercise.id] === 'left'
                    ? 'bg-accent/20 text-accent border border-accent/30 shadow-glow-accent'
                    : 'bg-white/5 text-text-muted border border-white/10'
                }`}
              >
                Left
                {sideCompleted[currentExercise.id]?.[currentSetIdx]?.left && (
                  <FiCheck className="inline ml-1 text-success" />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* INPUTS - context-aware based on exercise type */}
      {isTimed ? (
        <TimedExerciseCard
          exerciseName={currentExercise.exerciseName}
          currentSetIdx={currentSetIdx}
          totalSets={currentExercise.sets.length}
          duration={currentSet?.reps || 30}
          onUpdateDuration={(duration) => onUpdateSetReps(currentExercise.id, currentSetIdx, duration)}
          onCompleteSet={() => onCompleteSet(currentExercise.id, currentSetIdx, true, currentExercise.sets.length)}
        />
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8 w-full max-w-md md:max-w-none justify-center">
          {/* Only show weight for weighted exercises */}
          {!isBW && (
            <>
              <div className="flex flex-col items-center">
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2">Weight (kg)</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const current = currentSet?.weight || 0
                      if (current >= 0.5) {
                        onUpdateSetWeight(currentExercise.id, currentSetIdx, current - 0.5)
                      }
                    }}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10 hover:text-text-primary transition-all active:scale-95"
                  >
                    <FiMinus size={18} />
                  </button>
                  <input
                    type="number"
                    value={currentSet?.weight || ''}
                    onChange={e => onUpdateSetWeight(currentExercise.id, currentSetIdx, Number(e.target.value))}
                    className="w-20 h-16 bg-white/5 border-2 border-white/10 rounded-2xl text-center text-3xl font-display font-bold text-text-primary focus:outline-none focus:border-primary/60 focus:shadow-glow transition-all"
                    min={0}
                    step={0.5}
                    placeholder="0"
                  />
                  <button
                    onClick={() => {
                      const current = currentSet?.weight || 0
                      onUpdateSetWeight(currentExercise.id, currentSetIdx, current + 0.5)
                    }}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 hover:border-primary/50 transition-all active:scale-95 shadow-glow"
                  >
                    <FiPlus size={18} />
                  </button>
                </div>
              </div>
              <span className="hidden md:inline-block text-3xl text-text-muted font-light">&times;</span>
            </>
          )}
          <div className="flex flex-col items-center">
            <label className="text-xs text-text-muted uppercase tracking-wider mb-2">Reps</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const current = currentSet?.reps || 1
                  if (current > 1) {
                    onUpdateSetReps(currentExercise.id, currentSetIdx, current - 1)
                  }
                }}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10 hover:text-text-primary transition-all active:scale-95"
              >
                <FiMinus size={18} />
              </button>
              <input
                type="number"
                value={currentSet?.reps || ''}
                onChange={e => onUpdateSetReps(currentExercise.id, currentSetIdx, Number(e.target.value))}
                className="w-20 h-16 bg-white/5 border-2 border-white/10 rounded-2xl text-center text-3xl font-display font-bold text-text-primary focus:outline-none focus:border-primary/60 focus:shadow-glow transition-all"
                min={1}
                placeholder="10"
              />
              <button
                onClick={() => {
                  const current = currentSet?.reps || 0
                  onUpdateSetReps(currentExercise.id, currentSetIdx, current + 1)
                }}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 hover:border-primary/50 transition-all active:scale-95 shadow-glow"
              >
                <FiPlus size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BIG Complete Button (only show for non-timed exercises) */}
      {!isTimed && (() => {
        const isPerSide = perSideEnabled[currentExercise.id]
        const side = currentSide[currentExercise.id] || 'right'
        const sides = sideCompleted[currentExercise.id]?.[currentSetIdx]
        const bothSidesDone = sides?.left && sides?.right

        if (isPerSide && !bothSidesDone) {
          // Per-side mode: complete current side
          const sideLabel = side === 'right' ? 'Right' : 'Left'
          const otherSide = side === 'right' ? 'left' : 'right'
          const currentSideDone = side === 'right' ? sides?.right : sides?.left
          const otherSideDone = side === 'right' ? sides?.left : sides?.right

          return (
            <button
              onClick={() => {
                onSideCompleted(currentExercise.id, currentSetIdx, side)
                // Switch to other side if not done
                if (!otherSideDone) {
                  onSetCurrentSide(currentExercise.id, otherSide)
                }
              }}
              disabled={currentSideDone}
              className={`w-full max-w-sm h-16 text-white text-xl font-display font-bold rounded-2xl shadow-glow active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-3 ${
                currentSideDone
                  ? 'bg-success/40 opacity-50 cursor-not-allowed'
                  : side === 'right'
                    ? 'bg-gradient-primary hover:shadow-[0_0_40px_rgba(0,212,255,0.3)]'
                    : 'bg-gradient-accent hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]'
              }`}
            >
              <FiCheck className="text-2xl" /> Done {sideLabel}
            </button>
          )
        }

        // Normal mode or both sides done
        return (
          <button
            onClick={() => {
              onCompleteSet(currentExercise.id, currentSetIdx, true, currentExercise.sets.length)
              // Reset side tracking for next set
              if (isPerSide) {
                onSideCompleted(currentExercise.id, currentSetIdx + 1, 'right')
                onSetCurrentSide(currentExercise.id, 'right')
              }
            }}
            className="w-full max-w-sm h-16 bg-gradient-primary text-white text-xl font-display font-bold rounded-2xl shadow-glow hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-3"
          >
            {isPerSide && bothSidesDone ? (
              <><FiCheck className="text-2xl" /> Both sides done &mdash; {currentSetIdx < currentExercise.sets.length - 1 ? 'Next Set' : 'Complete'}</>
            ) : currentSetIdx < currentExercise.sets.length - 1 ? (
              <><FiCheck className="text-2xl" /> Done &mdash; Next Set</>
            ) : (
              <><FiCheck className="text-2xl" /> Complete Exercise</>
            )}
          </button>
        )
      })()}

      {/* Rest timer info (only for non-timed exercises) */}
      {!isTimed && (
        <p className="text-xs text-text-muted mt-3">
          {currentSetIdx < currentExercise.sets.length - 1
            ? 'Rest timer starts automatically after each set'
            : 'Last set for this exercise'}
        </p>
      )}

      {/* Exercise Guide Toggle */}
      <button
        onClick={() => onToggleGuide(currentExercise.id)}
        className="mt-4 text-sm text-primary hover:text-primary-light transition-colors flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2"
      >
        <FiVideo /> {isGuideOpen ? 'Hide guide' : 'Watch how to do this exercise'}
      </button>

      {/* Exercise Guide Panel with Video + Instructions */}
      {isGuideOpen && (
        <div className="mt-4 w-full max-w-2xl animate-fade-in">
          <Card variant="elevated" padding="md">
            {/* Video Section */}
            {(() => {
              const videoId = getExerciseVideoId(currentExercise.exerciseName)
              return (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-display font-bold text-text-primary text-sm flex items-center gap-2">
                      <FiVideo className="text-primary" /> Form Guide Video
                    </h4>
                    <a
                      href={getExerciseSearchUrl(currentExercise.exerciseName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary-light flex items-center gap-1 transition-colors"
                    >
                      More videos <FiExternalLink />
                    </a>
                  </div>
                  {videoId ? (
                    <div className="relative w-full rounded-xl overflow-hidden bg-black/30" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                        title={`${currentExercise.exerciseName} form guide`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full rounded-xl"
                      />
                    </div>
                  ) : (
                    <a
                      href={getExerciseSearchUrl(currentExercise.exerciseName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <FiVideo className="text-primary text-lg" />
                      </div>
                      <div className="flex-1">
                        <p className="text-text-primary font-medium text-sm">Watch form guide</p>
                        <p className="text-text-muted text-xs">Opens YouTube in a new tab</p>
                      </div>
                      <FiExternalLink className="text-primary flex-shrink-0" size={14} />
                    </a>
                  )}
                </div>
              )
            })()}

            {/* Written Instructions */}
            {exerciseInfo && (
              <>
                <h4 className="font-display font-bold text-text-primary text-sm mb-3">Step-by-Step</h4>
                <ol className="space-y-2.5">
                  {exerciseInfo.instructions.map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                {exerciseInfo.tips.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <h5 className="text-xs text-text-muted uppercase tracking-wider mb-2">Pro Tips</h5>
                    <ul className="space-y-1.5">
                      {exerciseInfo.tips.map((tip: string, i: number) => (
                        <li key={i} className="text-sm text-accent flex items-start gap-2">
                          <FiZap className="mt-0.5 flex-shrink-0" size={14} /> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {!exerciseInfo && (
              <p className="text-sm text-text-muted text-center">
                Focus on controlled form and full range of motion.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
