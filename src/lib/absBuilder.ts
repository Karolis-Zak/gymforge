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
  /** Human-readable list of ab regions hit (e.g. ["top abs", "lower abs", "deep core"]) */
  coverage: string[]
}

/**
 * Movement-pattern taxonomy mapped to ab anatomy.
 * Splitting flexion into upper/lower lets us hit BOTH "six pack top" (rectus abdominis
 * via trunk flexion) AND "lower abs" (rectus via hip flexion) in the same workout
 * instead of treating them as redundant.
 */
type Pattern =
  | 'upper-flexion'   // Trunk flexion → upper rectus emphasis (crunch, cable crunch)
  | 'lower-flexion'   // Hip flexion → lower rectus emphasis (leg raise, reverse crunch)
  | 'rotation'        // Oblique rotation (twist, woodchop, bicycle)
  | 'lateral'         // Oblique lateral flexion (side bend)
  | 'anti-extension'  // Deep core stability — transverse abdominis (plank, dead bug, ab wheel)
  | 'anti-rotation'   // Resists rotation (Pallof press, side plank)
  | 'dynamic'         // Cardio/metabolic core (mountain climber, bear crawl)
  | 'other'

/** Human-readable labels for the UI coverage badges */
const PATTERN_LABELS: Record<Pattern, string> = {
  'upper-flexion':  'top abs',
  'lower-flexion':  'lower abs',
  'rotation':       'obliques (twist)',
  'lateral':        'obliques (side bend)',
  'anti-extension': 'deep core',
  'anti-rotation':  'anti-rotation stability',
  'dynamic':        'dynamic / cardio',
  'other':          'other',
}

/**
 * Pattern priority by goal. The picker walks this list in order, picking the
 * highest-scored exercise of each pattern until the target count is reached.
 * This guarantees the most important patterns for the goal get represented.
 */
const PATTERN_PRIORITY: Record<AbsGoal, Pattern[]> = {
  // Tone wants visible-ab coverage first: upper + lower rectus, then obliques
  tone:      ['upper-flexion', 'lower-flexion', 'rotation', 'anti-extension', 'lateral', 'anti-rotation', 'dynamic'],
  // Strength: anti-extension is the king of trunk strength (rollout, plank); then anti-rotation
  strength:  ['anti-extension', 'anti-rotation', 'upper-flexion', 'rotation', 'lower-flexion', 'lateral', 'dynamic'],
  // Endurance: timed stability + dynamic finishers + high-rep flexion
  endurance: ['anti-extension', 'dynamic', 'lower-flexion', 'upper-flexion', 'rotation', 'anti-rotation', 'lateral'],
}

/**
 * Logical workout flow order — used to sort the final picked exercises so the
 * session reads top-to-bottom: warm-up → strength → variety → finisher.
 */
const FLOW_ORDER: Pattern[] = [
  'anti-extension',  // stability warm-up
  'anti-rotation',   // deep core priming
  'upper-flexion',   // direct rectus
  'lower-flexion',   // direct rectus (lower)
  'rotation',        // obliques
  'lateral',         // obliques (lateral)
  'dynamic',         // cardio finisher
  'other',
]

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

  // ANTI-ROTATION first — side plank is technically anti-lateral-flexion stability
  // but functionally trains anti-rotation, so group it here. Pallof too.
  if (lower.includes('side plank')) return 'anti-rotation'
  if (lower.includes('pallof')) return 'anti-rotation'

  // ANTI-EXTENSION — stability against trunk flexion/extension
  if (lower.includes('plank')) return 'anti-extension'
  if (lower.includes('dead bug') || lower.includes('bird dog')) return 'anti-extension'
  if (lower.includes('ab wheel') || lower.includes('rollout')) return 'anti-extension'

  // LATERAL flexion (oblique side bend)
  if (lower.includes('side bend')) return 'lateral'

  // ROTATION — twists, woodchops, landmine rotation, bicycle (rotational flexion)
  if (lower.includes('twist') || lower.includes('rotation') || lower.includes('wood') || lower.includes('landmine')) return 'rotation'
  if (lower.includes('bicycle')) return 'rotation'

  // LOWER-FLEXION — hip flexion dominant (lower rectus emphasis)
  if (lower.includes('leg raise')) return 'lower-flexion'
  if (lower.includes('reverse crunch')) return 'lower-flexion'
  if (lower.includes('flutter')) return 'lower-flexion'
  if (lower.includes('knee raise')) return 'lower-flexion'
  if (lower.includes('toe touch')) return 'lower-flexion' // legs lifted toward hands
  if (lower.includes('v-up')) return 'lower-flexion'      // hip-flexion dominant

  // UPPER-FLEXION — trunk flexion (upper rectus emphasis)
  if (lower.includes('crunch')) return 'upper-flexion'    // includes cable/machine/weighted/decline crunch
  if (lower.includes('sit-up') || lower.includes('situp')) return 'upper-flexion'

  // DYNAMIC — metabolic / cardio core
  if (lower.includes('mountain climber') || lower.includes('bear crawl')) return 'dynamic'

  return 'other'
}

const ALLOWED_DIFFICULTIES: Record<AbsLevel, Difficulty[]> = {
  beginner: ['beginner'],
  intermediate: ['beginner', 'intermediate'],
  advanced: ['beginner', 'intermediate', 'advanced'],
}

/**
 * Per-duration exercise count and base set count.
 * Calibrated against industry templates (Athlean-X, Caliber, Nippard) so density
 * matches user expectations AND total time fits the chosen duration.
 *
 *   Strength    — longer rest (60s) → one fewer exercise per duration
 *   Tone        — HIIT-style 30s rest, 3 sets each → moderate density
 *   Endurance   — McGill protocol: long holds (45-90s) × 2 sets (1-set circuit at 5min).
 *                 Three sets of 90s holds × 4-6 exercises blows any time budget;
 *                 endurance volume comes from hold duration, not set count.
 */
function getDurationTarget(duration: AbsAnswers['duration'], goal: AbsGoal): { exercises: number; sets: number } {
  if (goal === 'strength') {
    const map: Record<AbsAnswers['duration'], { exercises: number; sets: number }> = {
      5:  { exercises: 2, sets: 2 },
      10: { exercises: 3, sets: 3 },
      15: { exercises: 4, sets: 3 },
      20: { exercises: 5, sets: 3 },
    }
    return map[duration]
  }
  if (goal === 'endurance') {
    // McGill-style: long holds × fewer sets (1-2). Stimulus is TUT, not volume.
    const map: Record<AbsAnswers['duration'], { exercises: number; sets: number }> = {
      5:  { exercises: 4, sets: 1 },  // single-round circuit
      10: { exercises: 4, sets: 2 },  // 2 rounds at full holds
      15: { exercises: 5, sets: 2 },
      20: { exercises: 6, sets: 2 },
    }
    return map[duration]
  }
  // Tone — HIIT-style 30s rest, 2-3 sets, more exercises for variety
  const map: Record<AbsAnswers['duration'], { exercises: number; sets: number }> = {
    5:  { exercises: 3, sets: 2 },
    10: { exercises: 4, sets: 3 },
    15: { exercises: 5, sets: 3 },
    20: { exercises: 6, sets: 3 },
  }
  return map[duration]
}

function scoreExercise(ex: ExerciseData, goal: AbsGoal, equipment: AbsEquipment): number {
  let score = 0
  const lower = ex.name.toLowerCase()

  // Goal-specific bonuses
  if (goal === 'strength') {
    // Loaded / leverage exercises are the strength priority. Check by EQUIPMENT
    // (not just name) so Pallof Press, Landmine Rotation, etc. get credit even
    // though their names don't contain "cable"/"barbell".
    const isLoaded =
      ex.equipment === 'cable' ||
      ex.equipment === 'barbell' ||
      ex.equipment === 'dumbbell' ||
      ex.equipment === 'machine' ||
      ex.equipment === 'trap-bar' ||
      ex.equipment === 'ez-bar' ||
      ex.equipment === 'smith-machine' ||
      lower.includes('weighted') ||
      lower.includes('rollout') ||
      lower.includes('hanging')
    if (isLoaded) score += 6
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

/**
 * Timed-exercise hold durations (seconds), calibrated to industry standards:
 *   - Stuart McGill (spine biomechanics) — 60s minimum, 90-120s for trained
 *   - NSCA / AthleanX / Nippard programs — 30 / 45 / 60s for beg/int/adv tone
 *   - Endurance gets longer holds (45 / 60 / 90s) per McGill protocols
 *
 * For 5-min endurance specifically we cap at 45s (circuit-style) so the session
 * still fits a sensible time budget.
 */
function getTimedReps(level: AbsLevel, goal: AbsGoal, duration: AbsAnswers['duration']): number {
  if (goal === 'endurance') {
    // 5-min: 45s circuit-style holds, any level
    if (duration === 5) return 45
    // 10-min: cap advanced at 60s (90s × 2 sets × 4 ex = 16 min just on planks, blows budget)
    if (duration === 10) return level === 'beginner' ? 45 : 60
    // 15-20 min: full McGill-style holds (90s for trained adults)
    return level === 'beginner' ? 45 : level === 'intermediate' ? 60 : 90
  }
  // Tone & strength: same hold for any duration
  return level === 'beginner' ? 30 : level === 'intermediate' ? 45 : 60
}

/**
 * Non-timed rep counts, calibrated to:
 *   - Schoenfeld 2017 hypertrophy meta-analysis (8-15 reps for tone)
 *   - NSCA strength guidelines (5-8 reps loaded, 8-12 bodyweight)
 *   - Israetel/RP endurance ranges (15-30+ reps)
 */
function getRepCount(level: AbsLevel, goal: AbsGoal, isCompoundLike: boolean): number {
  if (level === 'beginner') {
    if (goal === 'strength')  return isCompoundLike ? 8  : 12
    if (goal === 'endurance') return 20
    return 12 // tone
  }
  if (level === 'intermediate') {
    if (goal === 'strength')  return isCompoundLike ? 8  : 12
    if (goal === 'endurance') return 25
    return 15 // tone
  }
  // advanced
  if (goal === 'strength')    return isCompoundLike ? 6  : 10
  if (goal === 'endurance')   return 30
  return 15 // tone
}

function getVolume(
  ex: ExerciseData,
  goal: AbsGoal,
  level: AbsLevel,
  baseSets: number,
  duration: AbsAnswers['duration'],
): { sets: number; reps: number; restSeconds: number } {
  const isCompoundLike = ex.equipment === 'cable' || ex.equipment === 'barbell' || ex.name.toLowerCase().includes('weighted') || ex.name.toLowerCase().includes('rollout')
  const timed = isDurationBased(ex.name)
  const sets = baseSets

  // Rest: abs recover fast (smaller muscles, high pain tolerance) — even loaded
  // strength work doesn't need 90-120s like squats/deadlifts. 60s is the upper bound.
  const restSeconds = goal === 'strength' ? 60 : goal === 'endurance' ? 25 : 30

  const reps = timed
    ? getTimedReps(level, goal, duration)
    : getRepCount(level, goal, isCompoundLike)

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

  // STEP 3: Pick exercises in goal-aware pattern priority order
  const target = getDurationTarget(answers.duration, answers.goal)
  const targetCount = target.exercises
  const priority = PATTERN_PRIORITY[answers.goal]
  const pickedIds = new Set<string>()
  const usedPatterns = new Set<Pattern>()
  const picked: ExerciseData[] = []

  // Pass 1: walk priority list, pick highest-scored exercise of each pattern
  // This guarantees the patterns most important for the goal get represented first
  for (const pattern of priority) {
    if (picked.length >= targetCount) break
    const best = scored.find(s => getPattern(s.ex) === pattern && !pickedIds.has(s.ex.id))
    if (best) {
      picked.push(best.ex)
      pickedIds.add(best.ex.id)
      usedPatterns.add(pattern)
    }
  }

  // Pass 2: fill remaining slots, preferring still-unused patterns first
  for (const { ex } of scored) {
    if (picked.length >= targetCount) break
    if (pickedIds.has(ex.id)) continue
    const pattern = getPattern(ex)
    if (usedPatterns.has(pattern)) continue
    picked.push(ex)
    pickedIds.add(ex.id)
    usedPatterns.add(pattern)
  }

  // Pass 3: fill any remaining slots, allowing pattern repeats (highest score wins)
  for (const { ex } of scored) {
    if (picked.length >= targetCount) break
    if (pickedIds.has(ex.id)) continue
    picked.push(ex)
    pickedIds.add(ex.id)
  }

  // Sort picked exercises by logical workout flow (warm-up → strength → variety → finisher)
  picked.sort((a, b) => FLOW_ORDER.indexOf(getPattern(a)) - FLOW_ORDER.indexOf(getPattern(b)))

  // Build exercise entries
  const exercises: AbsExercise[] = picked.map(ex => {
    const vol = getVolume(ex, answers.goal, answers.level, target.sets, answers.duration)
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

  // Build coverage list — what ab regions this workout actually hits
  const coverage: string[] = []
  for (const pattern of FLOW_ORDER) {
    if (pattern === 'other') continue
    if (picked.some(ex => getPattern(ex) === pattern)) {
      coverage.push(PATTERN_LABELS[pattern])
    }
  }

  return {
    name: buildName(answers),
    description: buildDescription(answers),
    exercises,
    estimatedMinutes: estimateMinutes(exercises),
    excludedByLimitations,
    safetyNetTriggered,
    targetExerciseCount: targetCount,
    coverage,
  }
}
