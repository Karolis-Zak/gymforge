/**
 * Exercise categories for plan generation.
 *
 * staple: Classic, proven exercises everyone should know. The foundation of any program.
 * standard: Good solid exercises, common in most programs.
 * unique: Interesting variations, less common, adds variety and novelty.
 *
 * If an exercise isn't listed here, it defaults to 'standard'.
 */

export type ExerciseCategory = 'staple' | 'standard' | 'unique'

// Staple exercises — the must-haves, proven classics
const STAPLE_IDS = new Set([
  // Chest
  'barbell-bench-press', 'dumbbell-bench-press', 'incline-barbell-bench-press',
  'incline-dumbbell-bench-press', 'push-up', 'dumbbell-flye', 'chest-dip',
  // Back
  'conventional-deadlift', 'barbell-bent-over-row', 'pull-up', 'chin-up',
  'lat-pulldown', 'seated-cable-row', 'dumbbell-row',
  // Shoulders
  'overhead-barbell-press', 'seated-dumbbell-press', 'dumbbell-lateral-raise',
  'cable-face-pull', 'arnold-press',
  // Biceps
  'barbell-curl', 'dumbbell-bicep-curl', 'hammer-curl', 'preacher-curl',
  // Triceps
  'cable-tricep-pushdown', 'skull-crusher', 'overhead-tricep-extension',
  'tricep-dip', 'diamond-push-up',
  // Quads
  'barbell-back-squat', 'barbell-front-squat', 'leg-press', 'leg-extension',
  'walking-lunge', 'goblet-squat', 'bulgarian-split-squat',
  // Hamstrings
  'romanian-deadlift', 'lying-leg-curl', 'seated-leg-curl',
  // Glutes
  'barbell-hip-thrust', 'glute-bridge', 'kettlebell-swing',
  // Calves
  'standing-calf-raise', 'seated-calf-raise',
  // Core
  'plank', 'hanging-leg-raise', 'cable-crunch', 'russian-twist', 'ab-wheel-rollout',
  // Traps
  'barbell-shrug', 'dumbbell-shrug',
])

// Unique/fun exercises — less common, interesting variations
const UNIQUE_IDS = new Set([
  // Chest
  'landmine-press', 'svend-press', 'floor-press',
  // Back
  'meadows-row', 'seal-row', 'snatch-grip-deadlift', 'deficit-deadlift',
  'landmine-row', 'lat-prayer',
  // Shoulders
  'band-pull-apart', 'dumbbell-y-raise', 'behind-the-neck-press', 'push-press',
  // Biceps
  'bayesian-curl', 'spider-curl', 'ez-bar-spider-curl',
  // Triceps
  'jm-press', 'bodyweight-tricep-extension',
  // Quads
  'zercher-squat', 'sissy-squat', 'pendulum-squat', 'wall-sit',
  // Hamstrings
  'nordic-hamstring-curl', 'glute-ham-raise', 'cable-pull-through',
  // Glutes
  'dumbbell-frog-pump', 'banded-clamshell',
  // Core
  'pallof-press', 'bear-crawl', 'dead-bug', 'bird-dog',
  'cable-wood-chop', 'cable-woodchop-low-to-high',
  // Other
  'towel-pull-up', 'kettlebell-clean-and-press',
])

export function getExerciseCategory(exerciseId: string): ExerciseCategory {
  if (STAPLE_IDS.has(exerciseId)) return 'staple'
  if (UNIQUE_IDS.has(exerciseId)) return 'unique'
  return 'standard'
}
