'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutLogStore } from '../store/workoutLogStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useUserStore } from '../store/userStore'
import { useOnboardingStore } from '../store/onboardingStore'
import { useToast } from '../store/toastStore'
import { exercises as exerciseDb } from '../data/exercises'
import {
  ExerciseFocusCard,
  ExerciseListPanel,
  RestTimerCard,
  SwapExerciseModal,
  WorkoutPreviewScreen,
} from './workout'
import {
  AUDIO, REST_ADJUSTMENTS,
  findExerciseInfo, isBodyweightExercise, isTimedExercise,
  isUnilateralExercise, getWristStressLevel, isWristDangerousExercise,
  formatTime, beep, suggestSwapExercises
} from '../lib/exerciseUtils'
import { Card, Button, Badge, ProgressRing } from './ui'
import { FiCheck, FiClock, FiChevronDown, FiChevronUp, FiPlay, FiSkipForward, FiArrowRight, FiExternalLink, FiVideo, FiX, FiEdit3, FiRepeat, FiZap, FiAward } from 'react-icons/fi'
import Confetti from 'react-confetti'

const FALLBACK_REST_SECONDS = 60

const motivationalQuotes = [
  'Progress, not perfection.',
  'Every rep counts.',
  'Strong today, stronger tomorrow.',
  'Consistency beats intensity.',
  'You are your only limit.',
  'Push your limits.',
  'Greatness is built, not born.',
  'One more rep.',
]


export const ActiveWorkout: React.FC = () => {
  const router = useRouter()
  const { currentWorkout, logs, completeSet, updateSetWeight, updateSetReps, completeWorkout, cancelWorkout, getExerciseProgress, updateSessionNotes, swapExercise, updateExerciseRPE } = useWorkoutLogStore()
  const { plans } = useWorkoutStore()
  const { defaultRestSeconds } = useUserStore()
  const { answers } = useOnboardingStore()
  const notify = useToast()
  const DEFAULT_REST_SECONDS = defaultRestSeconds || FALLBACK_REST_SECONDS
  const userInjuries = answers?.injuries || []
  const userInjurySeverity = answers?.injurySeverity || {}

  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({})
  const [motivationIdx, setMotivationIdx] = useState(0)
  const [restTimers, setRestTimers] = useState<Record<string, number>>({})
  const [restActive, setRestActive] = useState<Record<string, boolean>>({})
  const restRefs = useRef<Record<string, NodeJS.Timeout>>({})
  const [showGuide, setShowGuide] = useState<Record<string, boolean>>({})
  const [sessionNotes, setSessionNotes] = useState('')
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null)
  const [swapQuery, setSwapQuery] = useState('')
  const [swapSuggestions, setSwapSuggestions] = useState<typeof exerciseDb>([])
  // Per-side tracking
  const [perSideEnabled, setPerSideEnabled] = useState<Record<string, boolean>>({})
  const [currentSide, setCurrentSide] = useState<Record<string, 'left' | 'right'>>({})
  const [sideCompleted, setSideCompleted] = useState<Record<string, Record<number, { left: boolean; right: boolean }>>>({})

  // Workout elapsed timer
  useEffect(() => {
    if (!currentWorkout) return
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isTimerRunning, currentWorkout])

  // Motivation rotation
  useEffect(() => {
    const interval = setInterval(() => setMotivationIdx(i => (i + 1) % motivationalQuotes.length), 7000)
    return () => clearInterval(interval)
  }, [])

  // Rest timer tick
  useEffect(() => {
    Object.entries(restActive).forEach(([id, active]) => {
      if (active && !restRefs.current[id]) {
        restRefs.current[id] = setInterval(() => {
          setRestTimers(prev => {
            const next = Math.max((prev[id] || DEFAULT_REST_SECONDS) - 1, 0)
            if (next === 0) {
              beep()
              setRestActive(p => ({ ...p, [id]: false }))
              clearInterval(restRefs.current[id])
              delete restRefs.current[id]
            }
            return { ...prev, [id]: next }
          })
        }, 1000)
      } else if (!active && restRefs.current[id]) {
        clearInterval(restRefs.current[id])
        delete restRefs.current[id]
      }
    })
    return () => { Object.values(restRefs.current).forEach(clearInterval) }
  }, [restActive])

  // Auto-collapse completed exercises — only depends on currentWorkout changes
  useEffect(() => {
    if (!currentWorkout) return
    setCollapsedExercises(prev => {
      const next = { ...prev }
      let changed = false
      currentWorkout.exercises.forEach(ex => {
        if (ex.sets.every(s => s.completed) && next[ex.id] === undefined) {
          next[ex.id] = true
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [currentWorkout])

  // Generate smart suggestions when swap modal opens
  useEffect(() => {
    if (swappingExerciseId && currentWorkout) {
      const exercise = currentWorkout.exercises.find(ex => ex.id === swappingExerciseId)
      if (exercise) {
        const suggestions = suggestSwapExercises(exercise.exerciseName, userInjuries, userInjurySeverity)
        setSwapSuggestions(suggestions)
        setSwapQuery('')
      }
    }
  }, [swappingExerciseId, currentWorkout, userInjuries, userInjurySeverity])

  // Get rest seconds for a specific exercise (from plan or default)
  // MUST be before early returns to maintain hook count consistency
  const workoutPlan = plans.find(p => p.id === currentWorkout?.planId)
  const getRestForExercise = useCallback((exerciseId: string): number => {
    if (!workoutPlan) return DEFAULT_REST_SECONDS
    const exercise = currentWorkout?.exercises.find(e => e.id === exerciseId)
    if (!exercise) return DEFAULT_REST_SECONDS
    const planEx = workoutPlan.exercises.find(e => e.id === exercise.exerciseId)
    return planEx?.restSeconds || DEFAULT_REST_SECONDS
  }, [workoutPlan, currentWorkout, DEFAULT_REST_SECONDS])

  // Complete a set and start rest timer
  const handleCompleteSet = useCallback((exerciseId: string, setIndex: number, markAsCompleted: boolean, setsLength: number) => {
    completeSet(exerciseId, setIndex, markAsCompleted)
    if (markAsCompleted && setIndex < setsLength - 1) {
      const restTime = getRestForExercise(exerciseId)
      setRestTimers(prev => ({ ...prev, [exerciseId]: restTime }))
      setRestActive(prev => ({ ...prev, [exerciseId]: true }))
    }
  }, [completeSet, getRestForExercise])

  const handleFinish = useCallback(() => {
    if (sessionNotes.trim()) updateSessionNotes(sessionNotes.trim())
    completeWorkout(timer)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 4000)
    notify.success('Workout complete!')
    setTimeout(() => router.push('/progress'), 2000)
  }, [sessionNotes, updateSessionNotes, completeWorkout, timer, router])

  const handleCancel = useCallback(() => {
    if (confirm('Cancel this workout? Your progress will be lost.')) {
      cancelWorkout()
      router.push('/plans')
    }
  }, [cancelWorkout, router])

  if (!currentWorkout) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[60vh]">
        <Card className="text-center py-16 max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FiPlay className="text-primary text-3xl" />
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-2">No active workout</h2>
          <p className="text-text-secondary mb-6">Pick a plan and start training.</p>
          <Button variant="primary" size="lg" onClick={() => router.push('/plans')}>
            Go to Plans <FiArrowRight />
          </Button>
        </Card>
      </div>
    )
  }

  // PREVIEW SCREEN — before workout starts
  if (!workoutStarted) {
    return (
      <WorkoutPreviewScreen
        currentWorkout={currentWorkout}
        onStart={() => { setWorkoutStarted(true); setIsTimerRunning(true) }}
        onCancel={() => { cancelWorkout(); router.push('/plans') }}
      />
    )
  }

  const totalSets = currentWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const completedSets = currentWorkout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)
  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  const allDone = completedSets === totalSets && totalSets > 0

  // Find the current active exercise and set
  const currentExercise = currentWorkout.exercises.find(ex => !ex.sets.every(s => s.completed))
  const currentSetIdx = currentExercise ? currentExercise.sets.findIndex(s => !s.completed) : -1

  const getPB = (exerciseId: string) => {
    const progress = getExerciseProgress(exerciseId)
    let maxWeight = 0
    progress.weights.forEach(w => { if (w && w > maxWeight) maxWeight = w })
    return maxWeight > 0 ? maxWeight : null
  }

  // Weight progression suggestion
  const getSuggestedWeight = (exerciseId: string): number | null => {
    const progress = getExerciseProgress(exerciseId)
    if (progress.weights.length < 2) return null
    const recent = progress.weights.filter(w => w !== null).slice(-3) as number[]
    if (recent.length < 2) return null
    const lastWeight = recent[recent.length - 1]
    const lastReps = progress.totalReps[progress.totalReps.length - 1]
    // If user hit target reps at this weight for 2+ sessions, suggest increase
    const hitTarget = recent.filter(w => w === lastWeight).length >= 2 && lastReps >= 8
    return hitTarget ? lastWeight + 2.5 : null
  }

  const handleShare = () => {
    const summary = `GymForge Workout: ${currentWorkout.planName}\n${completedSets}/${totalSets} sets completed.`
    navigator.clipboard.writeText(summary).then(() => {
      notify.success('Copied to clipboard!')
    }).catch(() => {
      notify.error('Could not copy — check browser permissions')
    })
  }

  return (
    <div className="animate-fade-in space-y-6">
      {showConfetti && (
        <Confetti width={typeof window !== 'undefined' ? window.innerWidth : 1920} height={typeof window !== 'undefined' ? window.innerHeight : 1080} numberOfPieces={300} recycle={false} />
      )}

      {/* ===== TOP BAR ===== */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary">{currentWorkout.planName}</h1>
          <p className="text-text-muted text-sm italic mt-1 line-clamp-1">{`"${motivationalQuotes[motivationIdx]}"`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-background-card border border-white/10 rounded-2xl px-4 py-2">
            <FiClock className="text-primary" />
            <span className="font-mono text-lg font-bold text-primary">{formatTime(timer)}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowNotesPanel(!showNotesPanel)} aria-label="Workout notes"><FiEdit3 /></Button>
          <Button variant="danger" size="sm" onClick={handleCancel}><FiX /> Cancel</Button>
        </div>
      </div>

      {/* ===== PROGRESS BAR ===== */}
      <div>
        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-primary transition-all duration-700 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" style={{ animationDuration: '2s' }} />
          </div>
        </div>
        <div className="flex justify-between text-xs text-text-muted mt-1.5">
          <span>{completedSets} / {totalSets} sets done</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {/* ===== Last Session Notes ===== */}
      {(() => {
        const lastLog = logs
          .filter(l => l.completed && l.planId === currentWorkout.planId && l.sessionNotes)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        if (!lastLog) return null
        return (
          <Card className="border-accent/10 bg-accent/5">
            <div className="flex items-start gap-3">
              <FiEdit3 className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-text-muted mb-1">
                  Last session ({new Date(lastLog.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})
                </p>
                <p className="text-sm text-text-secondary">{lastLog.sessionNotes}</p>
              </div>
            </div>
          </Card>
        )
      })()}

      {/* ===== Notes Panel ===== */}
      {showNotesPanel && (
        <Card className="animate-fade-in">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">Workout Notes</h3>
          <textarea
            value={sessionNotes}
            onChange={e => setSessionNotes(e.target.value)}
            placeholder="How are you feeling? Energy level, mood, anything to remember..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none h-20"
          />
          <p className="text-xs text-text-muted mt-1">Saved when you finish the workout.</p>
        </Card>
      )}

      {/* ===== Swap Exercise Modal ===== */}
      <SwapExerciseModal
        exerciseId={swappingExerciseId}
        swapSuggestions={swapSuggestions}
        swapQuery={swapQuery}
        onQueryChange={setSwapQuery}
        onClose={() => { setSwappingExerciseId(null); setSwapQuery('') }}
        onSwap={(newExId, newExName) => {
          swapExercise(swappingExerciseId!, newExId, newExName)
          setSwappingExerciseId(null)
          setSwapQuery('')
          setSwapSuggestions([])
          notify.success(`Swapped to ${newExName}`)
        }}
        userInjuries={userInjuries}
        userInjurySeverity={userInjurySeverity}
      />

      {/* ===== CENTRAL FOCUS: Current Exercise ===== */}
      {currentExercise && !allDone && (() => {
        const exerciseInfo = findExerciseInfo(currentExercise.exerciseName)
        const isResting = restActive[currentExercise.id]
        const suggestedWeight = getSuggestedWeight(currentExercise.exerciseId)
        const restTime = restTimers[currentExercise.id] || 0
        const currentSet = currentExercise.sets[currentSetIdx]
        const isGuideOpen = showGuide[currentExercise.id]
        const isBW = isBodyweightExercise(currentExercise.exerciseName)
        const isTimed = isTimedExercise(currentExercise.exerciseName)

        return (
          <Card className="border-primary/30 bg-gradient-to-b from-primary/5 to-transparent" padding="lg">
            {/* REST TIMER - takes over the whole card */}
            {isResting ? (
              <RestTimerCard
                exerciseId={currentExercise.id}
                currentSetIdx={currentSetIdx}
                totalSets={currentExercise.sets.length}
                restTime={restTime}
                defaultRestSeconds={DEFAULT_REST_SECONDS}
                onAdjustRest={(exId, delta) => setRestTimers(prev => ({ ...prev, [exId]: Math.max(0, (prev[exId] || 0) + delta) }))}
                onSkipRest={(exId) => setRestActive(prev => ({ ...prev, [exId]: false }))}
              />
            ) : (() => {
              const pb = getPB(currentExercise.exerciseId)
              const sessionMax = Math.max(...currentExercise.sets.map(s => s.weight || 0))
              const isNewPB = pb && sessionMax > pb
              return (
              <ExerciseFocusCard
                currentExercise={currentExercise}
                currentSetIdx={currentSetIdx}
                exerciseInfo={exerciseInfo}
                suggestedWeight={suggestedWeight}
                isBW={isBW}
                isTimed={isTimed}
                currentSet={currentSet}
                pb={pb}
                isNewPB={isNewPB || false}
                perSideEnabled={perSideEnabled}
                currentSide={currentSide}
                sideCompleted={sideCompleted}
                showGuide={showGuide}
                onTogglePerSide={(exId) => {
                  const enabled = !perSideEnabled[exId]
                  setPerSideEnabled(prev => ({ ...prev, [exId]: enabled }))
                  if (enabled && !currentSide[exId]) {
                    setCurrentSide(prev => ({ ...prev, [exId]: 'right' }))
                  }
                }}
                onSetCurrentSide={(exId, side) => setCurrentSide(prev => ({ ...prev, [exId]: side }))}
                onUpdateSetWeight={(exId, setIdx, weight) => updateSetWeight(exId, setIdx, weight)}
                onUpdateSetReps={(exId, setIdx, reps) => updateSetReps(exId, setIdx, reps)}
                onCompleteSet={handleCompleteSet}
                onToggleGuide={(exId) => setShowGuide(prev => ({ ...prev, [exId]: !prev[exId] }))}
                onSwapExercise={(exId) => setSwappingExerciseId(exId)}
                onSideCompleted={(exId, setIdx, side) => {
                  setSideCompleted(prev => ({
                    ...prev,
                    [exId]: {
                      ...prev[exId],
                      [setIdx]: {
                        ...(prev[exId]?.[setIdx] || { left: false, right: false }),
                        [side]: true,
                      }
                    }
                  }))
                }}
              />
            )})()}
          </Card>
        )
      })()}

      {/* ===== ALL DONE ===== */}
      {allDone && (
        <Card className="border-success/30 bg-success/5 text-center py-12">
          <div className="text-6xl mb-4"><FiAward className="text-success" size={64} /></div>
          <h2 className="text-3xl font-display font-bold text-text-primary mb-2">Workout Complete!</h2>
          <p className="text-text-secondary mb-6">You crushed all {totalSets} sets in {formatTime(timer)}</p>
          <button
            onClick={handleFinish}
            className="w-full max-w-sm mx-auto h-16 bg-gradient-success text-white text-xl font-display font-bold rounded-2xl shadow-glow-success hover:shadow-[0_0_40px_rgba(34,197,94,0.3)] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-3"
          >
            <FiCheck className="text-2xl" /> Finish Workout
          </button>
        </Card>
      )}

      {/* ===== All Exercises List ===== */}
      <ExerciseListPanel
        currentWorkout={currentWorkout}
        currentExerciseId={currentExercise?.id}
        collapsedExercises={collapsedExercises}
        onToggleCollapse={(exId, collapsed) => setCollapsedExercises(prev => ({ ...prev, [exId]: collapsed }))}
        getPB={getPB}
        onShowGuide={(exId) => setShowGuide(prev => ({ ...prev, [exId]: true }))}
        onUpdateRPE={updateExerciseRPE}
      />

      {/* ===== Floating Finish Early Button ===== */}
      {!allDone && completedSets > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={handleFinish}
            className="bg-background-elevated border border-white/10 text-text-secondary px-6 py-3 rounded-2xl shadow-card hover:text-text-primary hover:border-primary/30 transition-all backdrop-blur-xl text-sm font-medium flex items-center gap-2"
          >
            <FiCheck /> Finish &amp; Save Progress
          </button>
        </div>
      )}

    </div>
  )
}
