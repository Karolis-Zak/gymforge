/**
 * Exercise detection and classification utilities
 * Used across components for consistent exercise categorization
 */

import { exercises as exerciseDb } from '../data/exercises'

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
