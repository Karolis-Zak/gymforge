import { exercises as exerciseDb, type ExerciseData, type Difficulty } from '../data/exercises'

export type AbsGoal = 'tone' | 'strength' | 'endurance'
export type AbsLevel = 'beginner' | 'intermediate' | 'advanced'
export type AbsEquipment = 'bodyweight' | 'gym'

/**
 * Capability/safety filters — each true value EXCLUDES exercises that depend on
 * that capability or stress that area. Defaults are all false (no restrictions).
 */
export interface AbsLimitations {
  lowerBack: boolean   // sensitive lower back — avoid loaded flexion / heavy rotation
  wrists: boolean      // wrist pain in plank/push-up positions
  cantPlank: boolean   // can't hold a 30-sec plank yet
  cantLegRaise: boolean // can't do straight-leg raises (no hip flexor / core baseline)
}

export const DEFAULT_LIMITATIONS: AbsLimitations = {
  lowerBack: false,
  wrists: false,
  cantPlank: false,
  cantLegRaise: false,
}

export interface AbsAnswers {
  goal: AbsGoal
  level: AbsLevel
  duration: 5 | 10 | 15 | 20
  equipment: AbsEquipment
  limitations: AbsLimitations
}

export interface AbsExercise {
  id: string
  name: string
  sets: number
  reps: number
  notes: string
  restSeconds: number
  isDurationBased: boolean
}

export interface AbsPlan {
  name: string
  description: string
  exercises: AbsExercise[]
  estimatedMinutes: number
  /** Number of exercises eliminated by limitations (for transparency in UI) */
  excludedByLimitations: number
  /** Whether the safety net relaxed limitations to keep the pool large enough */
  safetyNetTriggered: boolean
  /** How many exercises were targeted for the chosen duration (vs how many fit) */
  targetExerciseCount: number
}

type Pattern = 'anti-flexion' | 'flexion' | 'rotation' | 'anti-rotation' | 'dynamic' | 'other'

// Keep in sync with planGenerator.ts isDurationBasedExercise()
const DURATION_BASED_KEYWORDS = ['plank', 'wall sit', 'dead hang', 'mountain climber', 'bear crawl', 'flutter', 'farmer', 'carry', 'suitcase', 'plate pinch']

function isDurationBased(name: string): boolean {
  const lower = name.toLowerCase()
  return DURATION_BASED_KEYWORDS.some(k => lower.includes(k))
}

/**
 * Returns true if this exercise should be EXCLUDED for the given limitations.
 * Exclusions are intentionally conservative — when in doubt, exclude.
 *
 * Mappings (each limitation triggers specific exclusions):
 *   lowerBack:    weighted flexion, ab wheel/rollout, decline crunch, sit-ups,
 *                 weighted Russian twist, hanging straight-leg raise
 *   wrists:       all plank variants, ab wheel/rollout, mountain climber,
 *                 bear crawl, side plank
 *   cantPlank:    plank variants, ab wheel/rollout, bear crawl
 *                 (these all require baseline plank-position strength)
 *   cantLegRaise: any leg raise, V-up, flutter, toe touch, Russian twist,
 *                 reverse crunch, hanging knee raise
 *                 (all require hip-flexor / V-sit core strength)
 */
function isExcludedByLimitations(ex: ExerciseData, lim: AbsLimitations): boolean {
  const lower = ex.name.toLowerCase()
  const equip = ex.equipment

  if (lim.lowerBack) {
    // Loaded flexion / rotation under load is the highest risk for sensitive backs
    if (lower.includes('weighted')) return true
    if (lower.includes('ab wheel') || lower.includes('rollout')) return true
    if (lower.includes('decline')) return true
    if (lower.includes('sit-up') || lower.includes('situp')) return true
    if (lower.includes('hanging') && lower.includes('leg raise')) return true
    // Loaded rotation / lateral flexion (dumbbell, barbell core moves)
    if (equip === 'dumbbell' && (lower.includes('twist') || lower.includes('side bend') || lower.includes('woodchop') || lower.includes('wood chop'))) return true
    if (lower.includes('landmine')) return true
  }

  if (lim.wrists) {
    if (lower.includes('plank')) return true
    if (lower.includes('ab wheel') || lower.includes('rollout')) return true
    if (lower.includes('mountain climber')) return true
    if (lower.includes('bear crawl')) return true
    if (lower.includes('bird dog')) return true // quadruped wrist load
  }

  if (lim.cantPlank) {
    if (lower.includes('plank')) return true
    if (lower.includes('ab wheel') || lower.includes('rollout')) return true
    if (lower.includes('bear crawl')) return true
    if (lower.includes('mountain climber')) return true // plank position with leg motion
  }

  if (lim.cantLegRaise) {
    if (lower.includes('leg raise')) return true
    if (lower.includes('v-up')) return true
    if (lower.includes('flutter')) return true
    if (lower.includes('toe touch')) return true
    if (lower.includes('russian twist')) return true
    if (lower.includes('reverse crunch')) return true
    if (lower.includes('knee raise')) return true
    if (lower.includes('hanging')) return true // hanging anything needs grip + hip flexor
    if (lower.includes('bicycle crunch')) return true // feet-up flow demands hip flexor
  }

  return false
}

function getPattern(ex: ExerciseData): Pattern {
  const lower = ex.name.toLowerCase()
  if (lower.includes('plank') || lower.includes('dead bug') || lower.includes('bird dog') || lower.includes('rollout')) return 'anti-flexion'
  if (lower.includes('crunch') || lower.includes('sit-up') || lower.includes('toe touch') || lower.includes('v-up') || lower.includes('leg raise') || lower.includes('knee raise') || lower.includes('flutter')) return 'flexion'
  if (lower.includes('twist') || lower.includes('rotation') || lower.includes('wood') || lower.includes('side bend')) return 'rotation'
  if (lower.includes('pallof') || lower.includes('side plank')) return 'anti-rotation'
  if (lower.includes('mountain climber') || lower.includes('bear crawl') || lower.includes('bicycle')) return 'dynamic'
  return 'other'
}

const ALLOWED_DIFFICULTIES: Record<AbsLevel, Difficulty[]> = {
  beginner: ['beginner'],
  intermediate: ['beginner', 'intermediate'],
  advanced: ['beginner', 'intermediate', 'advanced'],
}

// Per-duration exercise count and base set count.
// Tuned so the time math (estimateMinutes) lands within the budget.
// Strength goal needs longer rest, so it gets fewer exercises at the same duration.
function getDurationTarget(duration: AbsAnswers['duration'], goal: AbsGoal): { exercises: number; sets: number } {
  if (goal === 'strength') {
    // Strength uses longer rest — cap exercises so total time still fits
    const map: Record<AbsAnswers['duration'], { exercises: number; sets: number }> = {
      5:  { exercises: 2, sets: 2 },
      10: { exercises: 3, sets: 3 },
      15: { exercises: 3, sets: 3 },
      20: { exercises: 4, sets: 3 },
    }
    return map[duration]
  }
  // Tone / endurance — shorter rest, more variety
  const map: Record<AbsAnswers['duration'], { exercises: number; sets: number }> = {
    5:  { exercises: 2, sets: 2 },
    10: { exercises: 3, sets: 3 },
    15: { exercises: 4, sets: 3 },
    20: { exercises: 5, sets: 3 },
  }
  return map[duration]
}

function scoreExercise(ex: ExerciseData, goal: AbsGoal, equipment: AbsEquipment): number {
  let score = 0
  const lower = ex.name.toLowerCase()

  // Goal-specific bonuses
  if (goal === 'strength') {
    // Loaded/leverage moves shine for strength
    if (lower.includes('weighted') || lower.includes('cable') || lower.includes('barbell') || lower.includes('dumbbell') || lower.includes('rollout') || lower.includes('hanging')) score += 6
    if (lower.includes('ab wheel')) score += 5
    if (ex.difficulty === 'advanced') score += 2
  } else if (goal === 'tone') {
    // Variety + visible-ab work (rectus + obliques)
    if (lower.includes('crunch') || lower.includes('twist') || lower.includes('bicycle') || lower.includes('v-up')) score += 4
    if (lower.includes('cable')) score += 2 // cable crunch is great for definition
  } else if (goal === 'endurance') {
    // Long-duration / high-rep bodyweight
    if (ex.equipment === 'bodyweight' || ex.equipment === 'none') score += 3
    if (isDurationBased(ex.name)) score += 4
    if (lower.includes('flutter') || lower.includes('mountain climber') || lower.includes('bear crawl')) score += 3
  }

  // Stability staples always get baseline credit
  if (lower.includes('plank') || lower.includes('dead bug') || lower.includes('bird dog')) score += 2

  // Mild penalty for equipment user doesn't have
  if (equipment === 'bodyweight' && ex.equipment !== 'bodyweight' && ex.equipment !== 'none') {
    score -= 100 // hard exclude — filter handles this but defensive
  }

  return score
}

function getVolume(ex: ExerciseData, goal: AbsGoal, level: AbsLevel, baseSets: number): { sets: number; reps: number; restSeconds: number } {
  const isCompoundLike = ex.equipment === 'cable' || ex.equipment === 'barbell' || ex.name.toLowerCase().includes('weighted') || ex.name.toLowerCase().includes('rollout')
  const timed = isDurationBased(ex.name)

  // baseSets is already chosen by getDurationTarget() to fit total time budget
  const sets = baseSets

  let reps: number
  let restSeconds: number

  if (level === 'beginner') {
    if (timed) reps = goal === 'endurance' ? 25 : 20
    else reps = goal === 'endurance' ? 15 : 10
    restSeconds = goal === 'endurance' ? 30 : 45
  } else if (level === 'intermediate') {
    if (timed) reps = goal === 'endurance' ? 35 : 30
    else if (goal === 'strength') reps = isCompoundLike ? 8 : 12
    else reps = goal === 'endurance' ? 20 : 15
    restSeconds = goal === 'strength' ? 60 : goal === 'endurance' ? 25 : 40
  } else {
    if (timed) reps = goal === 'endurance' ? 45 : 40
    else if (goal === 'strength') reps = isCompoundLike ? 6 : 10
    else reps = goal === 'endurance' ? 25 : 15
    restSeconds = goal === 'strength' ? 75 : goal === 'endurance' ? 20 : 30
  }

  return { sets, reps, restSeconds }
}

function estimateMinutes(exercises: AbsExercise[]): number {
  let totalSec = 0
  exercises.forEach(ex => {
    // Ab moves are quick: ~10s setup + ~1.5s/rep ROM (vs 30s+2s/rep for compound lifts)
    const workPerSet = ex.isDurationBased ? ex.reps : 10 + ex.reps * 1.5
    const work = workPerSet * ex.sets
    const rest = ex.restSeconds * Math.max(0, ex.sets - 1)
    totalSec += work + rest + 20 // 20s transition between exercises
  })
  return Math.max(1, Math.round(totalSec / 60))
}

function buildName(answers: AbsAnswers): string {
  const goalLabel = answers.goal === 'tone' ? 'Define' : answers.goal === 'strength' ? 'Strength' : 'Endurance'
  const levelLabel = answers.level.charAt(0).toUpperCase() + answers.level.slice(1)
  return `Abs — ${answers.duration}min ${goalLabel} (${levelLabel})`
}

function buildDescription(answers: AbsAnswers): string {
  const goalText = answers.goal === 'tone'
    ? 'Mixed flexion + rotation work to carve definition.'
    : answers.goal === 'strength'
      ? 'Loaded core work for raw trunk strength.'
      : 'High-rep, time-under-tension work for endurance.'
  return `${answers.duration}-minute ${answers.level} abs session. ${goalText} ${answers.equipment === 'gym' ? 'Uses available gym equipment.' : 'Bodyweight only — anywhere, anytime.'}`
}

export function generateAbsPlan(answers: AbsAnswers, shuffle: boolean = false): AbsPlan {
  // STEP 1: Base pool — core exercises matching difficulty + equipment
  const allowedDifficulties = ALLOWED_DIFFICULTIES[answers.level]
  const basePool = exerciseDb.filter(ex => {
    if (ex.primaryMuscle !== 'core') return false
    if (!allowedDifficulties.includes(ex.difficulty)) return false
    if (answers.equipment === 'bodyweight' && ex.equipment !== 'bodyweight' && ex.equipment !== 'none') return false
    return true
  })

  // STEP 2: Apply limitation filters
  const lim = answers.limitations
  const anyLimitations = lim.lowerBack || lim.wrists || lim.cantPlank || lim.cantLegRaise
  let pool = anyLimitations
    ? basePool.filter(ex => !isExcludedByLimitations(ex, lim))
    : basePool
  let safetyNetTriggered = false

  // SAFETY NET 1: if limitations gutted the pool, relax difficulty (allow any)
  if (pool.length < 3 && anyLimitations) {
    const relaxedDifficulty = exerciseDb.filter(ex => {
      if (ex.primaryMuscle !== 'core') return false
      if (answers.equipment === 'bodyweight' && ex.equipment !== 'bodyweight' && ex.equipment !== 'none') return false
      return !isExcludedByLimitations(ex, lim)
    })
    if (relaxedDifficulty.length > pool.length) {
      pool = relaxedDifficulty
      safetyNetTriggered = true
    }
  }

  // (No second safety net that drops equipment — if user picked bodyweight only, we
  // honour that and just generate fewer exercises; the warning explains why.)

  // The number eliminated = base pool size - effective pool size (after limitations)
  // Calculated against the BASE pool so the count reflects what their limitations cost
  const excludedByLimitations = anyLimitations
    ? Math.max(0, basePool.length - basePool.filter(ex => !isExcludedByLimitations(ex, lim)).length)
    : 0

  // Score and sort. When shuffling, add small random jitter so re-rolls produce variety.
  const scored = pool
    .map(ex => ({
      ex,
      score: scoreExercise(ex, answers.goal, answers.equipment) + (shuffle ? Math.random() * 5 : 0),
    }))
    .sort((a, b) => b.score - a.score)

  // Pick exercises with pattern variety — at most 1 per pattern (relaxed if pool small)
  const target = getDurationTarget(answers.duration, answers.goal)
  const targetCount = target.exercises
  const usedPatterns = new Set<Pattern>()
  const picked: ExerciseData[] = []

  // Pass 1: prefer different patterns
  for (const { ex } of scored) {
    if (picked.length >= targetCount) break
    const pattern = getPattern(ex)
    if (usedPatterns.has(pattern) && pattern !== 'other') continue
    picked.push(ex)
    usedPatterns.add(pattern)
  }

  // Pass 2: fill remaining slots, allowing pattern repeats
  for (const { ex } of scored) {
    if (picked.length >= targetCount) break
    if (picked.some(p => p.id === ex.id)) continue
    picked.push(ex)
  }

  // Build exercise entries
  const exercises: AbsExercise[] = picked.map(ex => {
    const vol = getVolume(ex, answers.goal, answers.level, target.sets)
    const timed = isDurationBased(ex.name)
    let notes = ex.tips[0] || ''
    if (timed) notes = `Hold/perform for ${vol.reps} seconds per set. ${notes}`.trim()
    return {
      id: ex.id,
      name: ex.name,
      sets: vol.sets,
      reps: vol.reps,
      notes,
      restSeconds: vol.restSeconds,
      isDurationBased: timed,
    }
  })

  return {
    name: buildName(answers),
    description: buildDescription(answers),
    exercises,
    estimatedMinutes: estimateMinutes(exercises),
    excludedByLimitations,
    safetyNetTriggered,
    targetExerciseCount: targetCount,
  }
}
