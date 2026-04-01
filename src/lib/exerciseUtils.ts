/**
 * Exercise detection and classification utilities
 * Used across components for consistent exercise categorization
 */

import { exercises as exerciseDb } from '../data/exercises'
import { getExerciseCategory } from '../data/exerciseCategories'

// Audio constants for beep notification
export const AUDIO = {
  FREQUENCY: 880, // Hz
  GAIN: 0.1, // 0-1 scale
  DURATION: 0.2, // seconds
} as const

// Rest timer adjustment increments
export const REST_ADJUSTMENTS = {
  DECREASE: 15, // seconds
  INCREASE_SHORT: 15, // seconds
  INCREASE_LONG: 60, // seconds
} as const

// Exercise classification keywords
const BODYWEIGHT_KEYWORDS = [
  'push-up', 'pushup', 'pull-up', 'pullup', 'plank', 'crunch',
  'sit-up', 'burpee', 'lunge', 'squat', 'dip', 'mountain climber', 'leg raise'
] as const

const TIMED_EXERCISE_KEYWORDS = [
  'plank', 'hold', 'dead hang', 'wall sit', 'farmer', 'carry', 'suitcase'
] as const

const UNILATERAL_KEYWORDS = [
  'single arm', 'single leg', 'one arm', 'one leg', 'concentration',
  'curl', 'lunge', 'split squat', 'kickback', 'lateral raise', 'front raise',
  'dumbbell row', 'pistol'
] as const

const WRIST_STRESS_SEVERE = [
  'dead hang', 'plate pinch', 'wrist curl', 'wrist extension'
] as const

const WRIST_STRESS_MODERATE = [
  'pull-up', 'pull up', 'chin-up', 'chin up', 'dip', 'inverted row'
] as const

/**
 * Find exercise info from database by name match
 * Uses three-tier matching: exact, contains, partial
 */
export function findExerciseInfo(exerciseName: string) {
  const lower = exerciseName.toLowerCase()
  return (
    exerciseDb.find(ex => ex.name.toLowerCase() === lower) ||
    exerciseDb.find(ex => lower.includes(ex.name.toLowerCase())) ||
    exerciseDb.find(ex => ex.name.toLowerCase().includes(lower))
  )
}

/**
 * Check if exercise is bodyweight (no equipment needed)
 */
export function isBodyweightExercise(exerciseName: string): boolean {
  const info = findExerciseInfo(exerciseName)
  if (info) return info.equipment === 'bodyweight' || info.equipment === 'none'
  return BODYWEIGHT_KEYWORDS.some(kw => exerciseName.toLowerCase().includes(kw))
}

/**
 * Check if exercise is time-based (hold/carry duration)
 */
export function isTimedExercise(exerciseName: string): boolean {
  const lower = exerciseName.toLowerCase()
  return TIMED_EXERCISE_KEYWORDS.some(kw => lower.includes(kw))
}

/**
 * Check if exercise can be performed per-side (unilateral)
 */
export function isUnilateralExercise(exerciseName: string): boolean {
  const info = findExerciseInfo(exerciseName)
  const lower = exerciseName.toLowerCase()
  
  // Dumbbell isolation exercises are commonly unilateral
  if (info && info.equipment === 'dumbbell' && info.type === 'isolation') return true
  
  return UNILATERAL_KEYWORDS.some(kw => lower.includes(kw))
}

/**
 * Determine wrist stress level for exercises
 * SEVERE: always exclude
 * MODERATE: exclude for acute, penalize for chronic
 * MILD: penalize
 */
export function getWristStressLevel(exerciseName: string): 'severe' | 'moderate' | 'mild' | 'none' {
  const lower = exerciseName.toLowerCase()
  
  if (WRIST_STRESS_SEVERE.some(kw => lower.includes(kw))) return 'severe'
  if (WRIST_STRESS_MODERATE.some(kw => lower.includes(kw))) return 'moderate'
  if (lower.includes('row') || lower.includes('press') || lower.includes('carry')) return 'mild'
  
  return 'none'
}

/**
 * Check if exercise is dangerous for wrist injuries
 */
export function isWristDangerousExercise(exerciseName: string, isAcuteWrist: boolean): boolean {
  const stressLevel = getWristStressLevel(exerciseName)
  
  // SEVERE always excludes
  if (stressLevel === 'severe') return true
  
  // MODERATE excludes only for acute
  if (stressLevel === 'moderate' && isAcuteWrist) return true
  
  return false
}

/**
 * Format seconds to HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

/**
 * Calculate total volume (weight × reps) from an array of exercises
 */
export function calculateVolume(
  exercises: Array<{ sets: Array<{ weight?: number; reps?: number }> }>
): number {
  return exercises.reduce(
    (total, ex) =>
      total +
      ex.sets.reduce(
        (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
        0
      ),
    0
  )
}

/**
 * Smart exercise scoring for sorted lists
 * @param ex - exercise object from database
 * @param isolationScore - bonus for isolation exercises (default: 10)
 * @param compoundScore - bonus for compound exercises (default: 5)
 */
export function getSmartScore(
  ex: { id: string; type: string; difficulty: string },
  isolationScore = 10,
  compoundScore = 5
): number {
  const cat = getExerciseCategory(ex.id)
  let score = cat === 'staple' ? 30 : cat === 'standard' ? 15 : 0
  score += ex.type === 'isolation' ? isolationScore : compoundScore
  score += ex.difficulty === 'beginner' ? 5 : ex.difficulty === 'intermediate' ? 2 : 0
  return score
}

/**
 * Play a beep notification using Web Audio API
 * Safely handles browser environments and fallbacks
 */
export function beep() {
  try {
    if (typeof window === 'undefined') return
    const AudioContextClass: typeof AudioContext | undefined =
      window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = AUDIO.FREQUENCY
    o.connect(g)
    g.connect(ctx.destination)
    g.gain.value = AUDIO.GAIN
    o.start(0)
    o.stop(ctx.currentTime + AUDIO.DURATION)
    o.onended = () => ctx.close()
  } catch { /* ignore audio errors */ }
}

/**
 * Suggest smart swap alternatives based on current exercise context
 * Prioritizes: same muscle, same type, same equipment, difficulty match, secondary muscles
 */
export function suggestSwapExercises(
  currentExerciseName: string,
  injuries: string[] = [],
  injurySeverity: Record<string, string> = {},
  allExercises = exerciseDb
): typeof exerciseDb {
  const current = findExerciseInfo(currentExerciseName)
  if (!current) return []

  // Check for acute wrist injury
  const hasAcuteWristInjury = injuries.includes('wrists') &&
                              (!injurySeverity['wrists'] || injurySeverity['wrists'] === 'acute')

  // Score exercises for relevance as swaps
  const scored = exerciseDb
    .filter(ex => ex.id !== current.id) // Don't suggest the same exercise
    .filter(ex => !(injuries.includes('wrists') && isWristDangerousExercise(ex.name, hasAcuteWristInjury))) // Filter by wrist safety
    .map(ex => {
      let score = 0

      // Same primary muscle = high priority
      if (ex.primaryMuscle === current.primaryMuscle) score += 10

      // Same type (compound/isolation) = helpful
      if (ex.type === current.type) score += 5

      // Same equipment = convenient (user likely has it)
      if (ex.equipment === current.equipment) score += 3

      // Secondary muscle overlap = bonus
      if (ex.secondaryMuscles.some(m => current.secondaryMuscles.includes(m))) score += 2

      // Similar difficulty = appropriate challenge
      const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 }
      const diffDist = Math.abs(difficultyOrder[ex.difficulty] - difficultyOrder[current.difficulty])
      if (diffDist <= 1) score += 3 - diffDist

      return { ex, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4) // Return top 4 suggestions
    .map(s => s.ex)

  return scored
}
