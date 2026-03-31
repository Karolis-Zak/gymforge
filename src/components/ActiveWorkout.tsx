'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutLogStore, type WorkoutSet } from '../store/workoutLogStore'
import { useWorkoutStore } from '../store/workoutStore'
import { exercises as exerciseDb } from '../data/exercises'
import { getExerciseVideoId, getExerciseSearchUrl } from '../data/exerciseVideos'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { ProgressRing } from './ui/ProgressRing'
import { FiCheck, FiClock, FiChevronDown, FiChevronUp, FiInfo, FiPlay, FiSkipForward, FiArrowRight, FiExternalLink, FiVideo, FiX, FiEdit3, FiRepeat } from 'react-icons/fi'
import Confetti from 'react-confetti'

const DEFAULT_REST_SECONDS = 60

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

const beep = () => {
  try {
    if (typeof window === 'undefined') return
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    o.connect(g)
    g.connect(ctx.destination)
    g.gain.value = 0.1
    o.start(0)
    o.stop(ctx.currentTime + 0.2)
    o.onended = () => ctx.close()
  } catch { /* ignore audio errors */ }
}

// Find exercise info from the database by name match
function findExerciseInfo(exerciseName: string) {
  const lower = exerciseName.toLowerCase()
  return exerciseDb.find(ex => ex.name.toLowerCase() === lower) ||
    exerciseDb.find(ex => lower.includes(ex.name.toLowerCase())) ||
    exerciseDb.find(ex => ex.name.toLowerCase().includes(lower))
}

// Determine if exercise is bodyweight/no-weight based on equipment
function isBodyweightExercise(exerciseName: string): boolean {
  const info = findExerciseInfo(exerciseName)
  if (info) return info.equipment === 'bodyweight' || info.equipment === 'none'
  const bwKeywords = ['push-up', 'pushup', 'pull-up', 'pullup', 'plank', 'crunch', 'sit-up', 'burpee', 'lunge', 'squat', 'dip', 'mountain climber', 'leg raise']
  return bwKeywords.some(kw => exerciseName.toLowerCase().includes(kw))
}

// Determine if exercise is time-based (hold)
function isTimedExercise(exerciseName: string): boolean {
  const timedKeywords = ['plank', 'hold', 'hang', 'wall sit', 'farmer']
  return timedKeywords.some(kw => exerciseName.toLowerCase().includes(kw))
}

// Determine if exercise can be done per-side (unilateral)
function isUnilateralExercise(exerciseName: string): boolean {
  const info = findExerciseInfo(exerciseName)
  const unilateralKeywords = ['single arm', 'single leg', 'one arm', 'one leg', 'concentration', 'curl', 'lunge', 'split squat', 'kickback', 'lateral raise', 'front raise', 'dumbbell row', 'pistol']
  const lower = exerciseName.toLowerCase()
  // Dumbbell exercises that are commonly done per-side
  if (info && info.equipment === 'dumbbell' && info.type === 'isolation') return true
  return unilateralKeywords.some(kw => lower.includes(kw))
}

export const ActiveWorkout: React.FC = () => {
  const router = useRouter()
  const { currentWorkout, completeSet, updateSetWeight, updateSetReps, completeWorkout, cancelWorkout, getExerciseProgress, updateSessionNotes, swapExercise } = useWorkoutLogStore()
  const { plans } = useWorkoutStore()

  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
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

  // Auto-collapse completed exercises
  useEffect(() => {
    if (!currentWorkout) return
    currentWorkout.exercises.forEach(ex => {
      if (ex.sets.every(s => s.completed) && collapsedExercises[ex.id] === undefined) {
        setCollapsedExercises(prev => ({ ...prev, [ex.id]: true }))
      }
    })
  }, [currentWorkout, collapsedExercises])

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

  const workoutPlan = plans.find(p => p.id === currentWorkout.planId)
  const totalSets = currentWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const completedSets = currentWorkout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)
  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  const allDone = completedSets === totalSets && totalSets > 0

  // Find the current active exercise and set
  const currentExercise = currentWorkout.exercises.find(ex => !ex.sets.every(s => s.completed))
  const currentSetIdx = currentExercise ? currentExercise.sets.findIndex(s => !s.completed) : -1

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
  }

  const getPB = (exerciseId: string) => {
    const progress = getExerciseProgress(exerciseId)
    let maxWeight = 0
    progress.weights.forEach(w => { if (w && w > maxWeight) maxWeight = w })
    return maxWeight > 0 ? maxWeight : null
  }

  // Get rest seconds for a specific exercise (from plan or default)
  const getRestForExercise = (exerciseId: string): number => {
    if (!workoutPlan) return DEFAULT_REST_SECONDS
    const exercise = currentWorkout?.exercises.find(e => e.id === exerciseId)
    if (!exercise) return DEFAULT_REST_SECONDS
    const planEx = workoutPlan.exercises.find(e => e.id === exercise.exerciseId)
    return planEx?.restSeconds || DEFAULT_REST_SECONDS
  }

  // Complete a set and start rest timer
  const handleCompleteSet = (exerciseId: string, setIndex: number, markAsCompleted: boolean, setsLength: number) => {
    completeSet(exerciseId, setIndex, markAsCompleted)
    if (markAsCompleted && setIndex < setsLength - 1) {
      const restTime = getRestForExercise(exerciseId)
      setRestTimers(prev => ({ ...prev, [exerciseId]: restTime }))
      setRestActive(prev => ({ ...prev, [exerciseId]: true }))
    }
  }

  const handleFinish = () => {
    if (sessionNotes.trim()) updateSessionNotes(sessionNotes.trim())
    completeWorkout(timer)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 4000)
    setToast('Workout complete!')
    setTimeout(() => { setToast(null); router.push('/progress') }, 2000)
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

  const handleCancel = () => {
    if (confirm('Cancel this workout? Your progress will be lost.')) {
      cancelWorkout()
      router.push('/plans')
    }
  }

  const handleShare = () => {
    const summary = `GymForge Workout: ${currentWorkout.planName}\n${completedSets}/${totalSets} sets completed.`
    navigator.clipboard.writeText(summary)
    setToast('Copied to clipboard!')
    setTimeout(() => setToast(null), 2000)
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
          <p className="text-text-muted text-sm italic mt-1 line-clamp-1">&quot;{motivationalQuotes[motivationIdx]}&quot;</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-background-card border border-white/10 rounded-2xl px-4 py-2">
            <FiClock className="text-primary" />
            <span className="font-mono text-lg font-bold text-primary">{formatTime(timer)}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowNotesPanel(!showNotesPanel)} aria-label="Workout notes"><FiEdit3 /></Button>
          <Button variant="danger" size="sm" onClick={handleCancel}><FiX /> Stop</Button>
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
      {swappingExerciseId && (
        <Card className="animate-fade-in border-accent/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-text-primary text-sm">Swap Exercise</h3>
            <Button variant="ghost" size="sm" onClick={() => { setSwappingExerciseId(null); setSwapQuery('') }}><FiX /></Button>
          </div>
          <input
            type="text"
            value={swapQuery}
            onChange={e => setSwapQuery(e.target.value)}
            placeholder="Search for replacement..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 mb-3"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {exerciseDb
              .filter(ex => swapQuery && ex.name.toLowerCase().includes(swapQuery.toLowerCase()))
              .slice(0, 10)
              .map(ex => (
                <button
                  key={ex.id}
                  onClick={() => {
                    swapExercise(swappingExerciseId, ex.id, ex.name)
                    setSwappingExerciseId(null)
                    setSwapQuery('')
                    setToast(`Swapped to ${ex.name}`)
                    setTimeout(() => setToast(null), 2000)
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-text-primary">{ex.name}</span>
                  <Badge variant="neutral" size="sm">{ex.primaryMuscle}</Badge>
                </button>
              ))}
            {swapQuery && exerciseDb.filter(ex => ex.name.toLowerCase().includes(swapQuery.toLowerCase())).length === 0 && (
              <p className="text-sm text-text-muted text-center py-3">No exercises found</p>
            )}
          </div>
        </Card>
      )}

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
              <div className="flex flex-col items-center py-8">
                <p className="text-sm text-text-muted uppercase tracking-wider mb-2">Rest Between Sets</p>
                <p className="text-text-secondary text-sm mb-6">Next: Set {currentSetIdx + 1} of {currentExercise.sets.length}</p>
                <ProgressRing value={restTime} max={DEFAULT_REST_SECONDS} size={180} strokeWidth={10} color="#00d4ff">
                  <span className="text-5xl font-display font-bold text-primary">{restTime}</span>
                  <span className="text-xs text-text-muted mt-1">seconds</span>
                </ProgressRing>
                <p className="text-text-secondary mt-6 mb-4">Breathe and recover.</p>
                <div className="flex gap-3">
                  <Button variant="secondary" size="md" onClick={() => {
                    setRestTimers(prev => ({ ...prev, [currentExercise.id]: DEFAULT_REST_SECONDS }))
                  }}>
                    +60s
                  </Button>
                  <Button variant="primary" size="md" onClick={() => setRestActive(prev => ({ ...prev, [currentExercise.id]: false }))}>
                    <FiSkipForward /> Skip Rest
                  </Button>
                </div>
              </div>
            ) : (
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
                  </div>
                  <p className="text-sm text-text-muted mt-3">
                    Set {currentSetIdx + 1} of {currentExercise.sets.length}
                  </p>

                  {/* Weight progression suggestion */}
                  {suggestedWeight && !isBW && (
                    <div className="mt-2 bg-success/10 border border-success/20 rounded-xl px-3 py-1.5 text-xs text-success flex items-center gap-1">
                      <FiArrowRight size={12} /> Try {suggestedWeight}kg today — you&apos;ve been consistent!
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setSwappingExerciseId(currentExercise.id)}
                      className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5"
                    >
                      <FiRepeat size={12} /> Swap
                    </button>
                  </div>
                </div>

                {/* Per-side toggle for unilateral exercises */}
                {isUnilateralExercise(currentExercise.exerciseName) && (
                  <div className="mb-4 flex flex-col items-center gap-2">
                    <button
                      onClick={() => {
                        const id = currentExercise.id
                        const enabled = !perSideEnabled[id]
                        setPerSideEnabled(prev => ({ ...prev, [id]: enabled }))
                        if (enabled && !currentSide[id]) {
                          setCurrentSide(prev => ({ ...prev, [id]: 'right' }))
                        }
                      }}
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
                          onClick={() => setCurrentSide(prev => ({ ...prev, [currentExercise.id]: 'right' }))}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            currentSide[currentExercise.id] === 'right'
                              ? 'bg-primary/20 text-primary border border-primary/30 shadow-glow'
                              : 'bg-white/5 text-text-muted border border-white/10'
                          }`}
                        >
                          🤚 Right
                          {sideCompleted[currentExercise.id]?.[currentSetIdx]?.right && (
                            <FiCheck className="inline ml-1 text-success" />
                          )}
                        </button>
                        <button
                          onClick={() => setCurrentSide(prev => ({ ...prev, [currentExercise.id]: 'left' }))}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            currentSide[currentExercise.id] === 'left'
                              ? 'bg-accent/20 text-accent border border-accent/30 shadow-glow-accent'
                              : 'bg-white/5 text-text-muted border border-white/10'
                          }`}
                        >
                          🫲 Left
                          {sideCompleted[currentExercise.id]?.[currentSetIdx]?.left && (
                            <FiCheck className="inline ml-1 text-success" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* INPUTS - context-aware based on exercise type */}
                <div className="flex items-center gap-6 mb-8">
                  {/* Only show weight for weighted exercises */}
                  {!isBW && (
                    <>
                      <div className="flex flex-col items-center">
                        <label className="text-xs text-text-muted uppercase tracking-wider mb-2">Weight (kg)</label>
                        <input
                          type="number"
                          value={currentSet?.weight || ''}
                          onChange={e => updateSetWeight(currentExercise.id, currentSetIdx, Number(e.target.value))}
                          className="w-28 h-16 bg-white/5 border-2 border-white/10 rounded-2xl text-center text-3xl font-display font-bold text-text-primary focus:outline-none focus:border-primary/60 focus:shadow-glow transition-all"
                          min={0}
                          step={0.5}
                          placeholder="0"
                        />
                      </div>
                      <span className="text-3xl text-text-muted font-light mt-6">&times;</span>
                    </>
                  )}
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-text-muted uppercase tracking-wider mb-2">
                      {isTimed ? 'Duration (sec)' : 'Reps'}
                    </label>
                    <input
                      type="number"
                      value={currentSet?.reps || ''}
                      onChange={e => updateSetReps(currentExercise.id, currentSetIdx, Number(e.target.value))}
                      className={`${isBW ? 'w-32' : 'w-24'} h-16 bg-white/5 border-2 border-white/10 rounded-2xl text-center text-3xl font-display font-bold text-text-primary focus:outline-none focus:border-primary/60 focus:shadow-glow transition-all`}
                      min={1}
                      placeholder={isTimed ? '30' : '10'}
                    />
                  </div>
                </div>

                {/* BIG Complete Button */}
                {(() => {
                  const isPerSide = perSideEnabled[currentExercise.id]
                  const side = currentSide[currentExercise.id] || 'right'
                  const sides = sideCompleted[currentExercise.id]?.[currentSetIdx]
                  const bothSidesDone = sides?.left && sides?.right

                  if (isPerSide && !bothSidesDone) {
                    // Per-side mode: complete current side
                    const sideLabel = side === 'right' ? '🤚 Right' : '🫲 Left'
                    const otherSide = side === 'right' ? 'left' : 'right'
                    const currentSideDone = side === 'right' ? sides?.right : sides?.left
                    const otherSideDone = side === 'right' ? sides?.left : sides?.right

                    return (
                      <button
                        onClick={() => {
                          // Mark this side as done
                          setSideCompleted(prev => ({
                            ...prev,
                            [currentExercise.id]: {
                              ...prev[currentExercise.id],
                              [currentSetIdx]: {
                                ...(prev[currentExercise.id]?.[currentSetIdx] || { left: false, right: false }),
                                [side]: true,
                              }
                            }
                          }))
                          // Switch to other side if not done
                          if (!otherSideDone) {
                            setCurrentSide(prev => ({ ...prev, [currentExercise.id]: otherSide }))
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
                        handleCompleteSet(currentExercise.id, currentSetIdx, true, currentExercise.sets.length)
                        // Reset side tracking for next set
                        if (isPerSide) {
                          setSideCompleted(prev => ({
                            ...prev,
                            [currentExercise.id]: {
                              ...prev[currentExercise.id],
                              [currentSetIdx + 1]: { left: false, right: false }
                            }
                          }))
                          setCurrentSide(prev => ({ ...prev, [currentExercise.id]: 'right' }))
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

                {/* Rest timer info */}
                <p className="text-xs text-text-muted mt-3">
                  {currentSetIdx < currentExercise.sets.length - 1
                    ? `${DEFAULT_REST_SECONDS}s rest timer starts automatically after each set`
                    : 'Last set for this exercise'}
                </p>

                {/* Exercise Guide Toggle */}
                <button
                  onClick={() => setShowGuide(prev => ({ ...prev, [currentExercise.id]: !prev[currentExercise.id] }))}
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
                            {exerciseInfo.instructions.map((step, i) => (
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
                                {exerciseInfo.tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-accent flex items-start gap-2">
                                    <span className="mt-0.5">💡</span> {tip}
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
            )}
          </Card>
        )
      })()}

      {/* ===== ALL DONE ===== */}
      {allDone && (
        <Card className="border-success/30 bg-success/5 text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
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
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">All Exercises</h3>
        {currentWorkout.exercises.map(exercise => {
          const allSetsDone = exercise.sets.every(s => s.completed)
          const isCollapsed = collapsedExercises[exercise.id] !== false
          const isCurrent = currentExercise?.id === exercise.id
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
                  onClick={() => setCollapsedExercises(prev => ({ ...prev, [exercise.id]: false }))}
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
                  <div className="flex items-center gap-1">
                    {!allSetsDone && (
                      <button onClick={() => setSwappingExerciseId(exercise.id)} className="text-text-muted hover:text-primary transition-colors p-1" aria-label="Swap exercise">
                        <FiRepeat size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setCollapsedExercises(prev => ({ ...prev, [exercise.id]: true }))}
                      className="text-text-muted hover:text-text-secondary transition-colors p-1"
                    >
                      <FiChevronUp size={16} />
                    </button>
                  </div>
                </div>

                {exerciseInfo && (
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="primary" size="sm">{exerciseInfo.primaryMuscle}</Badge>
                    <Badge variant="neutral" size="sm">{exerciseInfo.equipment}</Badge>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wider">
                        <th className="text-left py-1.5 px-2 w-10">Set</th>
                        {!isBW && <th className="text-left py-1.5 px-2">kg</th>}
                        <th className="text-left py-1.5 px-2">{isTimedExercise(exercise.exerciseName) ? 'Sec' : 'Reps'}</th>
                        <th className="text-right py-1.5 px-2 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set, idx) => (
                        <tr key={idx} className={`border-t border-white/5 ${set.completed ? 'opacity-50' : ''}`}>
                          <td className="py-2 px-2 text-text-muted">{idx + 1}</td>
                          {!isBW && (
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={set.weight || ''}
                                onChange={e => updateSetWeight(exercise.id, idx, Number(e.target.value))}
                                className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-text-primary text-sm focus:outline-none focus:border-primary/50"
                                disabled={set.completed}
                              />
                            </td>
                          )}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={e => updateSetReps(exercise.id, idx, Number(e.target.value))}
                              className="w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-text-primary text-sm focus:outline-none focus:border-primary/50"
                              disabled={set.completed}
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              onClick={() => handleCompleteSet(exercise.id, idx, !set.completed, exercise.sets.length)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                set.completed ? 'bg-success/20 text-success' : 'bg-white/5 text-text-muted hover:bg-primary/20 hover:text-primary'
                              }`}
                            >
                              {set.completed ? <FiCheck /> : 'Done'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          }

          return null
        })}
      </div>

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

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-background-elevated border border-white/10 text-text-primary px-6 py-3 rounded-2xl shadow-card animate-slide-up backdrop-blur-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
