import { exercises as exerciseDb, type ExerciseData, type MuscleGroup, type Difficulty } from '../data/exercises'
import { getExerciseCategory } from '../data/exerciseCategories'
import { GOAL_NAMES, SECONDARY_GOAL_NAMES } from './planConstants'
import type { OnboardingAnswers } from '../store/onboardingStore'

// Body composition assessment — used to adapt programming
export interface BodyComposition {
  bmi: number
  classification: 'underweight' | 'normal' | 'overweight' | 'obese' | 'very-obese'
  bodyweightExerciseDifficulty: number // 0-2, lower = harder for this person
  impactTolerance: 'low' | 'moderate' | 'high'
  relativeStrength: 'low' | 'moderate' | 'high' // e.g., stocky/bulky people often have high relative strength
  startingLoadModifier: number // 0.7-1.3, affects starting weight estimates
  overriddenDueToBMI?: boolean // true if impact tolerance was reduced due to BMI override
}

function assessBodyComposition(height: number, weight: number, bodyType: string): BodyComposition {
  const bmi = Math.round((weight / (height * height)) * 10000)

  let classification: BodyComposition['classification']
  if (bmi < 18.5) classification = 'underweight'
  else if (bmi < 25) classification = 'normal'
  else if (bmi < 30) classification = 'overweight'
  else if (bmi < 35) classification = 'obese'
  else classification = 'very-obese'

  // Map user's self-reported build type to actual impact/strength assessment
  let bodyweightExerciseDifficulty = 1
  let impactTolerance: BodyComposition['impactTolerance'] = 'moderate'
  let relativeStrength: BodyComposition['relativeStrength'] = 'moderate'
  let startingLoadModifier = 1.0

  if (bodyType === 'lean') {
    // Lean people typically find bodyweight easier but may be weaker absolutely
    bodyweightExerciseDifficulty = 1.3
    impactTolerance = 'high'
    relativeStrength = 'low'
    startingLoadModifier = 0.8
  } else if (bodyType === 'athletic') {
    // Athletic = baseline
    bodyweightExerciseDifficulty = 1.0
    impactTolerance = 'high'
    relativeStrength = 'moderate'
    startingLoadModifier = 1.0
  } else if (bodyType === 'stocky') {
    // Stocky/bulky people are typically stronger but bodyweight is harder
    bodyweightExerciseDifficulty = 0.7
    impactTolerance = 'moderate'
    relativeStrength = 'high'
    startingLoadModifier = 1.2
  } else if (bodyType === 'overweight') {
    // Overweight reduces bodyweight exercise ease significantly
    bodyweightExerciseDifficulty = 0.5
    impactTolerance = 'low'
    relativeStrength = 'moderate'
    startingLoadModifier = 0.9
  } else if (bodyType === 'obese') {
    // Obese makes bodyweight exercises very hard, low impact important
    bodyweightExerciseDifficulty = 0.3
    impactTolerance = 'low'
    relativeStrength = 'low'
    startingLoadModifier = 0.7
  } else {
    // Default/unknown body type — use athletic baseline
    bodyweightExerciseDifficulty = 1.0
    impactTolerance = 'high'
    relativeStrength = 'moderate'
    startingLoadModifier = 1.0
  }

  // Override assessment based on BMI if there's a conflict
  let overriddenDueToBMI = false
  if (bmi >= 30 && bodyweightExerciseDifficulty > 0.6) {
    bodyweightExerciseDifficulty = Math.min(bodyweightExerciseDifficulty, 0.6)
    impactTolerance = 'low'
    overriddenDueToBMI = true
  }
  if (bmi < 18.5 && relativeStrength === 'high') {
    relativeStrength = 'moderate'
  }

  return {
    bmi,
    classification,
    bodyweightExerciseDifficulty,
    impactTolerance,
    relativeStrength,
    startingLoadModifier,
    overriddenDueToBMI,
  }
}

export interface GeneratedExercise {
  id: string
  name: string
  sets: number
  reps: number
  notes: string
  restSeconds?: number
  isDurationBased?: boolean  // true for timed/carry/cardio exercises (reps = seconds)
  warmupSets?: Array<{ weight: string; reps: number; description: string }>  // Auto-generated warm-up for first compound
  rotationSchedule?: Array<{ weeks: string; exerciseName: string }>  // Exercise rotation over 12 weeks
}

export interface GeneratedDay {
  dayName: string
  splitName: string
  exercises: GeneratedExercise[]
  targetMuscles: MuscleGroup[]
  estimatedMinutes: number
}

export interface GeneratedPlan {
  name: string
  description: string
  days: GeneratedDay[]
  splitType: string
  weeklyProgression: Array<{ week: number; rpeMin: number; rpeMax: number; phase: string; description: string }>
}

// Major muscles get dedicated exercise slots
const MAJOR_MUSCLES: Set<MuscleGroup> = new Set(['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps'])

function roundToStandardReps(reps: number): number {
  const standards = [4, 5, 6, 8, 10, 12, 15, 20]
  return standards.reduce((prev, curr) => Math.abs(curr - reps) < Math.abs(prev - reps) ? curr : prev)
}

/**
 * Find alternative exercises with the same movement pattern
 * Used for smart rotation (Bench → Incline → Floor Press)
 */
function findRotationAlternatives(exerciseId: string, movementPattern: string, pool: ExerciseData[]): ExerciseData[] {
  const baseExercise = exerciseDb.find(e => e.id === exerciseId)
  if (!baseExercise) return []

  // Find exercises with:
  // 1. Same primary muscle
  // 2. Same movement pattern
  // 3. Same equipment (or compatible)
  return pool.filter(ex => {
    if (ex.id === exerciseId) return false // Exclude base exercise
    if (ex.primaryMuscle !== baseExercise.primaryMuscle) return false
    if (getMovementPattern(ex) !== movementPattern) return false
    // Prefer same or similar equipment
    if (Math.abs((EQUIPMENT_ORDER[ex.equipment] || 10) - (EQUIPMENT_ORDER[baseExercise.equipment] || 10)) > 2) return false
    return true
  })
}

/**
 * Generate warm-up sets for a compound exercise
 * Protocol: 50% × 8, 70% × 5, 85% × 2
 */
function generateWarmupSets(exerciseName: string, estimatedWeight: number = 100): Array<{ weight: string; reps: number; description: string }> {
  return [
    { weight: `${Math.round(estimatedWeight * 0.5)}`, reps: 8, description: 'Light, get joints moving' },
    { weight: `${Math.round(estimatedWeight * 0.7)}`, reps: 5, description: 'Build up to working weight' },
    { weight: `${Math.round(estimatedWeight * 0.85)}`, reps: 2, description: 'Final prep, near working weight' },
  ]
}

/**
 * Create a rotation schedule for an exercise across 12 weeks
 * Rotates every 3-4 weeks within same movement pattern
 */
function createRotationSchedule(exerciseId: string, movementPattern: string, totalWeeks: number, pool: ExerciseData[]): Array<{ weeks: string; exerciseName: string }> {
  const alternatives = findRotationAlternatives(exerciseId, movementPattern, pool)
  if (alternatives.length === 0) return [] // No alternatives, no rotation

  const baseExercise = exerciseDb.find(e => e.id === exerciseId)
  if (!baseExercise) return []

  const rotationSchedule: Array<{ weeks: string; exerciseName: string }> = []
  const rotationDuration = 3 // Rotate every 3 weeks
  const allExercises = [baseExercise, ...alternatives.slice(0, 3)] // Max 4 variations

  for (let week = 1; week <= totalWeeks; week += rotationDuration) {
    const exerciseIndex = Math.floor((week - 1) / rotationDuration) % allExercises.length
    const endWeek = Math.min(week + rotationDuration - 1, totalWeeks)
    rotationSchedule.push({
      weeks: week === endWeek ? `${week}` : `${week}-${endWeek}`,
      exerciseName: allExercises[exerciseIndex].name,
    })
  }

  return rotationSchedule
}

/**
 * Check if exercise is duration-based (performed for seconds, not reps)
 * Includes: timed holds, carries, and cardio circuits
 */
function isDurationBasedExercise(name: string): boolean {
  const lower = name.toLowerCase()

  // Isometric holds (static positions for time)
  if (lower.includes('plank') || lower.includes('wall sit') ||
      lower.includes('dead hang') || lower.includes('plate pinch')) return true

  // Carries (walk/hold for time)
  if (lower.includes('farmer') || lower.includes('carry') || lower.includes('suitcase')) return true

  // Cardio circuits (performed for time)
  if (lower.includes('mountain climber') || lower.includes('bear crawl') || lower.includes('flutter')) return true

  return false
}

// Deprecated: Use isDurationBasedExercise instead
function isTimedExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('plank') || lower.includes('wall sit') ||
         lower.includes('dead hang') || lower.includes('plate pinch') ||
         lower.includes('mountain climber') || lower.includes('bear crawl') ||
         lower.includes('flutter kick') || lower.includes('flutter') || lower.includes('band squat')
}

// Deprecated: Use isDurationBasedExercise instead
function isCarryExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('farmer') || lower.includes('carry') || lower.includes('suitcase')
}

// Deprecated: Use isDurationBasedExercise instead
function isCardioStyleExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('mountain climber') || lower.includes('bear crawl') || lower.includes('flutter')
}

/**
 * Detect movement pattern to prevent selecting multiple exercises of the same pattern
 * Patterns are sorted by priority/specificity to avoid mismatches
 * Note: In future, consider adding 'movementPattern' field to exercise database
 */
function getMovementPattern(ex: ExerciseData): string {
  const lower = ex.name.toLowerCase()

  // CURLS (check muscle group to differentiate bicep vs leg curl)
  if (lower.includes('curl')) {
    return ex.primaryMuscle === 'hamstrings' ? 'leg-curl' : 'curl'
  }

  // PRESSES (horizontal and vertical)
  if (lower.includes('bench press') || lower.includes('chest press') || lower.includes('floor press')) {
    return 'horizontal-press'
  }
  if (lower.includes('overhead') || lower.includes('shoulder press') || lower.includes('military') || lower.includes('arnold')) {
    return 'overhead-press'
  }

  // ROWS (horizontal pull, excluding upright)
  if (lower.includes('row') && !lower.includes('upright')) {
    return 'row'
  }

  // VERTICAL PULLS
  if (lower.includes('pulldown') || lower.includes('pull-up') || lower.includes('chin-up') || lower.includes('pull up')) {
    return 'vertical-pull'
  }

  // LEG PATTERNS
  if (lower.includes('squat') || lower.includes('leg press')) {
    return 'squat'
  }
  if (lower.includes('deadlift') || lower.includes('rdl') || lower.includes('good morning') || lower.includes('hip thrust')) {
    return 'hip-hinge'
  }
  if (lower.includes('lunge') || lower.includes('split squat') || lower.includes('step-up')) {
    return 'lunge'
  }

  // SHOULDER/ARM ISOLATIONS
  if (lower.includes('lateral raise') || lower.includes('front raise') || lower.includes('rear delt')) {
    return 'raise'
  }
  if (lower.includes('pushdown') || lower.includes('extension') || lower.includes('skull')) {
    return 'tricep-extension'
  }
  if (lower.includes('fly') || lower.includes('flye') || lower.includes('crossover') || lower.includes('pullover')) {
    return 'fly-stretch'
  }

  // OTHER PATTERNS
  if (lower.includes('shrug')) {
    return 'shrug'
  }
  if (lower.includes('wrist curl') || lower.includes('wrist extension')) {
    return 'wrist-curl'
  }
  if (lower.includes('push-up') || lower.includes('dip')) {
    return 'bodyweight-push'
  }

  return 'other'
}

const SPLIT_CONFIG: Record<number, { type: string; days: { name: string; muscles: MuscleGroup[] }[] }> = {
  2: { type: 'Full Body', days: [
    { name: 'Full Body A', muscles: ['chest', 'back', 'shoulders', 'quads', 'core'] },
    { name: 'Full Body B', muscles: ['back', 'glutes', 'hamstrings', 'shoulders', 'biceps', 'triceps', 'core'] },
  ]},
  3: { type: 'Push / Pull / Legs', days: [
    { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Pull', muscles: ['back', 'biceps', 'traps', 'forearms'] },
    { name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
  ]},
  4: { type: 'Upper / Lower', days: [
    { name: 'Upper A', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
    { name: 'Lower A', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
    { name: 'Upper B', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
    { name: 'Lower B', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
  ]},
  5: { type: '5-Day Split', days: [
    { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Pull', muscles: ['back', 'biceps', 'traps', 'forearms'] },
    { name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
    { name: 'Upper', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
    { name: 'Lower', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
  ]},
  6: { type: 'PPL × 2', days: [
    { name: 'Push A', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Pull A', muscles: ['back', 'biceps', 'traps', 'forearms'] },
    { name: 'Legs A', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
    { name: 'Push B', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Pull B', muscles: ['back', 'biceps', 'traps', 'forearms'] },
    { name: 'Legs B', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
  ]},
}

const INJURY_MAP: Record<string, MuscleGroup[]> = {
  shoulders: ['shoulders'], 'back-spine': ['back', 'traps'],
  knees: ['quads', 'hamstrings'], wrists: ['forearms'],
  hips: ['glutes', 'hamstrings'], ankles: ['calves'], neck: ['traps'],
}

/**
 * Determine which days should include core work
 * Core is a muscle that needs recovery — don't overuse it
 * Logic: Cap at 3-4x/week based on split frequency
 */
function getCoreDaysFromSplit(daysPerWeek: number, splitDays: { name: string }[]): Set<string> {
  const coreDays = new Set<string>()

  if (daysPerWeek <= 3) {
    // Full-body splits: core on all days (only 2-3x/week anyway)
    return new Set(splitDays.map((_, i) => i.toString()))
  }

  if (daysPerWeek === 4) {
    // Upper/Lower: core on both lower days (2x/week)
    // Days 1-3 are Upper A, Lower A, Upper B, Lower B
    // Core goes on Lower days (indices 1, 3)
    coreDays.add('1')
    coreDays.add('3')
    return coreDays
  }

  if (daysPerWeek === 6) {
    // PPL × 2: Core on A days only (3x/week: Push A, Pull B, Legs A)
    // Prevents overuse while covering all split patterns
    coreDays.add('0') // Push A
    coreDays.add('2') // Legs A
    // Skip Push B, Pull A, Legs B to avoid fatigue stacking
    return coreDays
  }

  // 5-day: 3x/week on primary days
  if (daysPerWeek === 5) {
    coreDays.add('0') // Push
    coreDays.add('2') // Legs
    // Pull (1) gets core via secondary, not primary focus
    return coreDays
  }

  // Fallback: every other day
  splitDays.forEach((_, i) => { if (i % 2 === 0) coreDays.add(i.toString()) })
  return coreDays
}

/**
 * Map focus areas to appropriate split days
 * Respects split structure + SMART core distribution
 */
function distributeFocusAreas(focusAreas: MuscleGroup[], dayMuscles: MuscleGroup[], daysPerWeek: number, dayIndex: number, splitDays: { name: string }[]): MuscleGroup[] {
  // Determine if THIS day should include core work
  const coreDaysForWeek = getCoreDaysFromSplit(daysPerWeek, splitDays)
  const shouldIncludeCore = coreDaysForWeek.has(dayIndex.toString())

  // Calves always included (small muscle, minimal interference)
  const alwaysIncluded: MuscleGroup[] = []
  if (shouldIncludeCore && focusAreas.includes('core')) {
    alwaysIncluded.push('core')
  }
  if (focusAreas.includes('calves')) {
    alwaysIncluded.push('calves')
  }

  // Other focus areas only add if they match the day's natural split
  const contextualFocus = focusAreas.filter(m => {
    if (m === 'core' || m === 'calves') return false
    return dayMuscles.includes(m)
  })

  return [...new Set([...dayMuscles, ...alwaysIncluded, ...contextualFocus])]
}
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const WEEKDAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}
const EQUIPMENT_ORDER: Record<string, number> = {
  barbell: 1, 'trap-bar': 1, 'smith-machine': 2, dumbbell: 3, 'ez-bar': 4,
  kettlebell: 5, cable: 6, machine: 7, bodyweight: 8, band: 9, 'pull-up-bar': 8, none: 10,
}
const CARDIO_EXERCISES = ['mountain-climber', 'bear-crawl', 'flutter-kick']

function getAvoidedMuscles(injuries: string[], severity: Record<string, string>): MuscleGroup[] {
  const avoided = new Set<MuscleGroup>()
  injuries.forEach(injury => {
    if (!severity[injury] || severity[injury] === 'acute') (INJURY_MAP[injury] || []).forEach(m => avoided.add(m))
  })
  return Array.from(avoided)
}
function getCautiousMuscles(injuries: string[], severity: Record<string, string>): MuscleGroup[] {
  const cautious = new Set<MuscleGroup>()
  injuries.forEach(injury => {
    if (severity[injury] === 'chronic') (INJURY_MAP[injury] || []).forEach(m => cautious.add(m))
  })
  return Array.from(cautious)
}
function getAllowedDifficulties(complexity: string): Difficulty[] {
  if (complexity === 'simple') return ['beginner']
  if (complexity === 'moderate') return ['beginner', 'intermediate']
  return ['beginner', 'intermediate', 'advanced']
}

// Exercises that should be completely excluded for wrist injuries (not just penalized)
function shouldExcludeForWristInjury(ex: ExerciseData, isAcuteWristInjury: boolean): boolean {
  const lower = ex.name.toLowerCase()

  // SEVERE: Dead hang, plate pinch, wrist curls — exclude for ANY wrist injury
  const isSevereWristExercise = (lower.includes('dead hang') ||
                                  lower.includes('plate pinch') ||
                                  (lower.includes('wrist') && (lower.includes('curl') || lower.includes('extension'))))

  // MODERATE: Pull-ups, dips, inverted rows — exclude only for ACUTE wrist injuries
  const isModerateWristExercise = (lower.includes('pull-up') || lower.includes('pull up') ||
                                    lower.includes('chin-up') || lower.includes('chin up') ||
                                    lower.includes('dip') || lower.includes('inverted row'))

  if (isSevereWristExercise) return true // Always exclude severe
  if (isAcuteWristInjury && isModerateWristExercise) return true // Exclude moderate only for acute

  return false
}

/**
 * Get rest time for an exercise based on goal, level, and exercise type
 * Accounts for compound vs isolation and session duration constraint
 */
function getRestSeconds(goal: string, level: string, isCompound: boolean, composition?: BodyComposition, sessionDuration?: number): number {
  // Heavier/less fit people need more rest for joint recovery
  const extraRest = composition && composition.impactTolerance === 'low' ? 30 : 0

  // For tight time windows (30 min), compounds must have shorter rest or they don't fit
  const timeConstraint = sessionDuration && sessionDuration <= 30 ? -15 : 0

  if (level === 'complete-beginner') {
    return isCompound ? (75 + extraRest + timeConstraint) : (45 + extraRest)
  }
  if (level === 'some-experience') {
    if (goal === 'strength') return isCompound ? (90 + extraRest) : (60 + extraRest)
    if (goal === 'fat-loss' || goal === 'endurance') return isCompound ? (45 + extraRest) : (30 + extraRest)
    return isCompound ? (60 + extraRest) : (45 + extraRest)
  }
  // Regular exerciser
  if (goal === 'strength') return isCompound ? (120 + extraRest) : (75 + extraRest)
  if (goal === 'muscle-building') return isCompound ? (75 + extraRest) : (60 + extraRest)
  if (goal === 'toning') return isCompound ? (60 + extraRest) : (45 + extraRest)
  if (goal === 'fat-loss') return isCompound ? (45 + extraRest) : (30 + extraRest)
  if (goal === 'endurance') return isCompound ? (40 + extraRest) : (25 + extraRest)
  return isCompound ? (60 + extraRest) : (45 + extraRest)
}

function getExerciseCount(targetDuration: number, level: string, goal: string, composition?: BodyComposition): number {
  const warmup = level === 'complete-beginner' ? 8 : 5
  const available = targetDuration - warmup - 3
  // Use compound rest for calculation (more conservative)
  const restSec = getRestSeconds(goal, level, true, composition, targetDuration)
  const avgSets = level === 'complete-beginner' ? 3 : (goal === 'strength' ? 4 : 3)
  const timePerEx = (avgSets * 1.5) + ((avgSets - 1) * restSec / 60)
  const min = targetDuration <= 30 ? 4 : 5
  // Beginners max out at 6 exercises (manageable learning load)
  // Others can go higher based on goal
  const maxByLevel = level === 'complete-beginner' ? 6 : (goal === 'endurance' ? 8 : 10)
  return Math.max(min, Math.min(Math.round(available / timePerEx), maxByLevel))
}

/**
 * Get rep range based on body type and goal
 * TRUE training logic: Body composition affects optimal stimulus
 */
function getRepRangeByBodyType(bodyType: string, goal: string): number {
  // Stocky = naturally strong → lower reps leverage this strength
  if (bodyType === 'stocky') {
    if (goal === 'strength') return 5
    if (goal === 'muscle-building') return 6
    if (goal === 'toning') return 8  // Still leverage strength
    return 8
  }

  // Lean = lighter absolute strength → needs higher reps for volume
  if (bodyType === 'lean') {
    if (goal === 'strength') return 6
    if (goal === 'muscle-building') return 10  // More volume needed
    if (goal === 'toning') return 12
    return 10
  }

  // Athletic = baseline
  if (bodyType === 'athletic') {
    if (goal === 'strength') return 6
    if (goal === 'muscle-building') return 8
    if (goal === 'toning') return 10
    return 10
  }

  // Overweight/Obese = conservative reps to avoid joint stress
  if (bodyType === 'overweight' || bodyType === 'obese') {
    if (goal === 'strength') return 8
    if (goal === 'muscle-building') return 10
    if (goal === 'toning') return 12
    return 12
  }

  return 10 // Default
}

function getVolume(level: string, primaryGoal: string, secondaryGoal: string, isCompound: boolean, bodyType?: string): { sets: number; reps: number } {
  let sets: number
  let reps: number

  if (level === 'complete-beginner') {
    sets = 3
    if (primaryGoal === 'strength') reps = isCompound ? 8 : 10
    else if (primaryGoal === 'muscle-building') reps = isCompound ? 10 : 12
    else if (primaryGoal === 'fat-loss' || primaryGoal === 'toning') reps = 12
    else if (primaryGoal === 'endurance') reps = isCompound ? 12 : 15
    else reps = 10
  } else if (level === 'some-experience') {
    sets = isCompound ? 3 : 3
    if (primaryGoal === 'strength') { reps = isCompound ? 6 : 10; if (isCompound) sets = 4 }
    else if (primaryGoal === 'muscle-building') reps = isCompound ? 8 : 10
    else if (primaryGoal === 'fat-loss' || primaryGoal === 'toning') reps = 12
    else if (primaryGoal === 'endurance') { reps = isCompound ? 12 : 15; sets = 2 }
    else reps = 10
  } else {
    if (primaryGoal === 'strength') { sets = isCompound ? 4 : 3; reps = isCompound ? 5 : 8 }
    else if (primaryGoal === 'muscle-building') { sets = isCompound ? 4 : 3; reps = isCompound ? 8 : 10 }
    else if (primaryGoal === 'fat-loss' || primaryGoal === 'toning') { sets = 3; reps = 12 }
    else if (primaryGoal === 'endurance') { sets = 2; reps = isCompound ? 12 : 15 }
    else { sets = 3; reps = 10 }
  }

  if (secondaryGoal === 'strength' && reps > 8) reps = Math.max(reps - 2, 8)
  if (secondaryGoal === 'muscle-building' && reps < 8) reps = 8
  if (secondaryGoal === 'fat-loss' && reps < 10) reps = 10

  // Apply body-type optimization if available
  if (bodyType && level === 'regular-exerciser') {
    const bodyTypeOptimalReps = getRepRangeByBodyType(bodyType, primaryGoal)
    // Shift reps toward body-type optimal (but don't override too much)
    reps = Math.round((reps + bodyTypeOptimalReps) / 2)
  }

  reps = roundToStandardReps(reps)
  return { sets, reps }
}

// Detect exercises that require a training partner
function requiresPartner(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('leg curl') && (lower.includes('dumbbell') || lower.includes('band'))
}

// Detect exercises unsuitable for complete beginners (high skill/risk/ROM)
function isBeginnerSafe(name: string): boolean {
  const lower = name.toLowerCase()
  // Extreme ROM or high-skill leg exercises
  if (lower.includes('nordic') || lower.includes('sissy') || lower.includes('zercher') ||
      lower.includes('pendulum') || lower.includes('belt squat')) return false
  // Awkward or uncomfortable variations
  if (lower.includes('chest-supported') || lower.includes('spider')) return false
  // High-skill or extreme exercises
  if (lower.includes('planche') || lower.includes('front lever')) return false
  return true
}

// Detect wrist stress level for chronic wrist injuries
function getWristStressLevel(name: string): 'severe' | 'moderate' | 'mild' | 'none' {
  const lower = name.toLowerCase()

  // Severe: direct wrist exercises or extreme holds
  if (lower.includes('dead hang') || lower.includes('plate pinch') ||
      (lower.includes('wrist') && (lower.includes('curl') || lower.includes('extension')))) {
    return 'severe'
  }

  // Moderate: sustained grip or wrist end-range stress
  if (lower.includes('pull-up') || lower.includes('pull up') ||
      lower.includes('chin-up') || lower.includes('chin up') ||
      lower.includes('dip') || lower.includes('inverted row')) {
    return 'moderate'
  }

  // Mild: wrist extension under load or pressing
  if (lower.includes('push-up') || lower.includes('push up') ||
      lower.includes('overhead') || lower.includes('shoulder press') ||
      lower.includes('curl') || lower.includes('shrug') ||
      lower.includes('farmer') || lower.includes('carry')) {
    return 'mild'
  }

  return 'none'
}

function scoreExercise(
  ex: ExerciseData, focusAreas: MuscleGroup[], familiarExercises: string[],
  comfort: string, usedIds: string[], cautiousMuscles: MuscleGroup[],
  hasPartner: string, hasBench: boolean | null, varietyPref: string, injuries: string[] = [],
  bodyComposition?: BodyComposition,
  bodyType?: string,
): number {
  let score = 0
  if (focusAreas.includes(ex.primaryMuscle)) score += 6
  if (ex.type === 'compound') score += 4
  const lower = ex.name.toLowerCase()
  if (familiarExercises.some(f => lower.includes(f.toLowerCase()))) score += 3

  const category = getExerciseCategory(ex.id)
  if (varietyPref === 'routine') {
    if (category === 'staple') score += 8; if (category === 'unique') score -= 4
  } else if (varietyPref === 'variety') {
    if (category === 'unique') score += 5; if (category === 'staple') score += 2
  } else {
    if (category === 'staple') score += 5; if (category === 'unique') score += 1
  }

  if (comfort === 'yes') {
    if (ex.type === 'compound' && (ex.equipment === 'barbell' || ex.equipment === 'dumbbell')) score += 3
  } else if (comfort === 'somewhat') {
    if (ex.equipment === 'dumbbell') score += 1
  } else {
    if (ex.equipment === 'barbell' || ex.equipment === 'ez-bar') score -= 6
    if (ex.equipment === 'machine' || ex.equipment === 'cable') score += 3
    if (ex.equipment === 'bodyweight') score += 2
  }

  if (hasPartner === 'no') {
    if (ex.equipment === 'barbell' && ex.type === 'compound') score -= 2
    if (requiresPartner(ex.name)) score -= 6
  }
  if (!hasBench) {
    // Flye exercises require a bench for proper ROM and safety
    if (lower.includes('flye') || lower.includes('fly')) score -= 8
    // Other bench-dependent movements
    if (lower.includes('incline') || lower.includes('decline') || lower.includes('chest-supported') || lower.includes('spider') || lower.includes('seal row')) score -= 8
  }
  if (usedIds.includes(ex.id)) score -= 5

  // Handle cautious muscles (injuries)
  if (cautiousMuscles.includes(ex.primaryMuscle)) {
    score -= ex.type === 'compound' ? 5 : 2
    // Extra penalty for high-impact movements on cautious joints
    const l = ex.name.toLowerCase()
    if (l.includes('lunge') || l.includes('jump') || l.includes('plyometric') || l.includes('box jump')) score -= 4
  }

  // Special handling for chronic wrist injuries: penalize wrist-stressful exercises
  if (injuries.includes('wrists')) {
    const wristStress = getWristStressLevel(ex.name)
    if (wristStress === 'severe') score -= 8
    else if (wristStress === 'moderate') score -= 5
    else if (wristStress === 'mild') score -= 2
  }

  // Body composition considerations
  if (bodyComposition) {
    // Penalize high-impact exercises for people with low impact tolerance
    if (bodyComposition.impactTolerance === 'low') {
      const isHighImpact = lower.includes('jump') || lower.includes('plyometric') ||
                          lower.includes('box') || lower.includes('sprint') ||
                          lower.includes('burpee') || lower.includes('lunge')
      if (isHighImpact) score -= 6
    }

    // Penalize difficult bodyweight exercises for heavier people
    if (ex.equipment === 'bodyweight' || ex.equipment === 'none') {
      const difficulty = bodyComposition.bodyweightExerciseDifficulty
      // If under 0.6, this is quite hard for them — penalize more
      if (difficulty < 0.6) {
        const penalty = Math.round((1 - difficulty) * 8)
        score -= penalty
      }
    }
  }

  // Body-type-aware exercise selection
  // Overweight/Obese: strongly prefer machines + cables for joint safety
  if (bodyType === 'overweight' || bodyType === 'obese') {
    if (ex.equipment === 'machine' || ex.equipment === 'cable') score += 4
    if (ex.equipment === 'barbell' && ex.type === 'compound') score -= 4  // Less joint stress with machines
  }

  if (isDurationBasedExercise(ex.name)) score -= 6

  // Prevent excessive front delt work — front raises cause shoulder imbalance
  // Front delts already get work from pressing movements
  if (lower.includes('front raise') || lower.includes('front delt')) score -= 10

  // Boost rear delt work — critical for shoulder health and balance
  if (lower.includes('rear delt') || lower.includes('reverse fly') || lower.includes('face pull') || lower.includes('band pull-apart')) score += 6

  // Boost pulling exercises for upper body days — prevent push/pull imbalance
  if (ex.primaryMuscle === 'back' || lower.includes('pull-up') || lower.includes('pull up') || lower.includes('chin-up') || lower.includes('chin up')) score += 3

  // Boost hamstring selection — prevent quad/hamstring imbalance
  if (ex.primaryMuscle === 'hamstrings') score += 2

  return score
}

function sortExercises(exercises: GeneratedExercise[]): GeneratedExercise[] {
  return exercises.sort((a, b) => {
    const infoA = exerciseDb.find(e => e.id === a.id)
    const infoB = exerciseDb.find(e => e.id === b.id)
    if (!infoA || !infoB) return 0
    if (infoA.type !== infoB.type) return infoA.type === 'compound' ? -1 : 1
    return (EQUIPMENT_ORDER[infoA.equipment] || 10) - (EQUIPMENT_ORDER[infoB.equipment] || 10)
  })
}

/**
 * Audit volume per muscle group across all days
 * Warns if any muscle gets <6 sets/week or >16 sets/week
 */
function auditVolumeBalance(days: GeneratedDay[]): { muscle: string; sets: number; status: 'low' | 'high' | 'balanced' }[] {
  const volumePerMuscle: Record<string, number> = {}

  days.forEach(day => {
    day.exercises.forEach(ex => {
      const info = exerciseDb.find(e => e.id === ex.id)
      if (!info) return

      const allMuscles = [info.primaryMuscle, ...info.secondaryMuscles]
      const setsForExercise = ex.isDurationBased ? 0 : ex.sets  // Don't count cardio finishers toward volume

      allMuscles.forEach(muscle => {
        volumePerMuscle[muscle] = (volumePerMuscle[muscle] || 0) + setsForExercise
      })
    })
  })

  return Object.entries(volumePerMuscle).map(([muscle, sets]) => ({
    muscle,
    sets,
    status: sets < 6 ? 'low' : sets > 16 ? 'high' : 'balanced'
  }))
}

/**
 * Determine RPE (Rate of Perceived Exertion) for a given week in training cycle
 * RPE 6-7 = easy (can do 4+ more reps)
 * RPE 8-9 = hard (can do 1-2 more reps)
 * RPE 5-6 = deload (moving without fatigue)
 */
function getWeekRPE(weekNumber: number, totalWeeks: number, primaryGoal: string): { min: number; max: number; description: string } {
  // Week 1: Always build
  if (weekNumber === 1) {
    return { min: 6, max: 7, description: 'Build phase: Learn form, move with control' }
  }

  // Last week: Always deload
  if (weekNumber === totalWeeks) {
    return { min: 5, max: 6, description: 'Deload week: Light, focus on movement quality' }
  }

  // Middle weeks: Progressive intensity buildup
  const progressRatio = (weekNumber - 1) / (totalWeeks - 1)

  // First third: Accumulation (add weight/reps)
  if (progressRatio <= 0.33) {
    return { min: 7, max: 8, description: 'Accumulation phase: Add weight or reps' }
  }

  // Second third: Intensity (push hard)
  if (progressRatio <= 0.67) {
    return { min: 8, max: 9, description: 'Intensity phase: Push hard, challenge yourself' }
  }

  // Final third before deload: Peak intensity
  return { min: 8, max: 9, description: 'Intensity phase: Push hard, challenge yourself' }
}

/**
 * Check push/pull balance and quad/hamstring balance
 * Critical for preventing imbalances that cause injuries
 */
function checkPushPullBalance(days: GeneratedDay[]): { balanced: boolean; pushSets: number; pullSets: number; issues: string[] } {
  let pushSets = 0
  let pullSets = 0
  const issues: string[] = []

  days.forEach(day => {
    day.exercises.forEach(ex => {
      const info = exerciseDb.find(e => e.id === ex.id)
      if (!info || ex.isDurationBased) return

      // Classify as push or pull
      const lower = info.name.toLowerCase()
      const isPush = info.primaryMuscle === 'chest' || info.primaryMuscle === 'shoulders' ||
                     info.primaryMuscle === 'triceps' || lower.includes('press') || lower.includes('push')
      const isPull = info.primaryMuscle === 'back' || info.primaryMuscle === 'biceps' ||
                     info.primaryMuscle === 'traps' || lower.includes('pull') || lower.includes('row') ||
                     lower.includes('curl')

      if (isPush) pushSets += ex.sets
      if (isPull) pullSets += ex.sets
    })
  })

  // Check balance (should be within ±2 sets)
  const difference = Math.abs(pushSets - pullSets)
  if (difference > 2) {
    issues.push(`Push/Pull imbalance: ${pushSets} push vs ${pullSets} pull sets. Risk: shoulder issues.`)
  }

  // Check for rear delts (critical for shoulder health)
  const hasRearDelts = days.some(day =>
    day.exercises.some(ex => {
      const info = exerciseDb.find(e => e.id === ex.id)
      if (!info) return false
      const lower = info.name.toLowerCase()
      return (lower.includes('face pull') || lower.includes('reverse') || lower.includes('rear delt') ||
              lower.includes('band pull') && lower.includes('apart'))
    })
  )
  if (!hasRearDelts) {
    issues.push(`No rear delt work detected. Add face pulls or reverse flyes for shoulder health.`)
  }

  return { balanced: issues.length === 0, pushSets, pullSets, issues }
}

/**
 * Check quad/hamstring balance
 * Imbalance leads to knee issues
 */
function checkLegBalance(days: GeneratedDay[]): { balanced: boolean; quadSets: number; hamstringSets: number; issues: string[] } {
  let quadSets = 0
  let hamstringSets = 0
  const issues: string[] = []

  days.forEach(day => {
    day.exercises.forEach(ex => {
      const info = exerciseDb.find(e => e.id === ex.id)
      if (!info || ex.isDurationBased) return

      if (info.primaryMuscle === 'quads') quadSets += ex.sets
      if (info.primaryMuscle === 'hamstrings') hamstringSets += ex.sets
    })
  })

  // Check balance
  const difference = Math.abs(quadSets - hamstringSets)
  if (difference > 2) {
    issues.push(`Quad/Hamstring imbalance: ${quadSets} quad vs ${hamstringSets} hamstring sets. Risk: knee issues.`)
  }

  return { balanced: issues.length === 0, quadSets, hamstringSets, issues }
}

function estimateDuration(exercises: GeneratedExercise[], level: string, goal: string, warmup: string, composition?: BodyComposition, sessionDuration?: number): number {
  const warmupMins = warmup === 'full' ? 10 : warmup === 'quick' ? 5 : 0
  let total = warmupMins + 3
  exercises.forEach(ex => {
    // Determine if exercise is likely compound based on rest time (compounds get longer rest)
    const isCompound = (ex.restSeconds || 0) > 50
    const restSec = ex.restSeconds || getRestSeconds(goal, level, isCompound, composition, sessionDuration)

    if (ex.isDurationBased) {
      // Duration-based exercise: 30sec + 5sec prep per set + rest between sets
      total += (ex.sets * ((5 + 30) / 60)) + ((ex.sets - 1) * restSec / 60)
    } else {
      // Rep-based exercise: ~1.5min per set + rest between sets
      total += (ex.sets * 1.5) + ((ex.sets - 1) * restSec / 60)
    }
  })
  return Math.round(total)
}

export function generatePlan(answers: OnboardingAnswers, usedExerciseIds: string[] = [], shuffle: boolean = false): GeneratedPlan {
  const split = SPLIT_CONFIG[answers.daysPerWeek] || SPLIT_CONFIG[3]
  const avoidedMuscles = getAvoidedMuscles(answers.injuries, answers.injurySeverity)
  const cautiousMuscles = getCautiousMuscles(answers.injuries, answers.injurySeverity)
  const allowedDifficulties = getAllowedDifficulties(answers.exerciseComplexity)

  // Assess body composition from height, weight, and user's self-reported body type
  const bodyComposition = answers.height > 0 && answers.weight > 0
    ? assessBodyComposition(answers.height, answers.weight, answers.bodyType || 'athletic')
    : undefined

  const exerciseCount = getExerciseCount(answers.sessionDuration, answers.fitnessLevel, answers.primaryGoal, bodyComposition)
  const sortedDays = [...answers.specificDays].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))

  // Check if user has ACUTE wrist injury (for stricter exclusions)
  const hasAcuteWristInjury = answers.injuries.includes('wrists') &&
                               (!answers.injurySeverity['wrists'] || answers.injurySeverity['wrists'] === 'acute')

  let pool = exerciseDb.filter(ex => {
    // Equipment check
    if (!(ex.equipment === 'bodyweight' || ex.equipment === 'none' || answers.availableEquipment.includes(ex.equipment))) return false
    // Injury checks
    if (avoidedMuscles.includes(ex.primaryMuscle)) return false
    if (ex.secondaryMuscles.some(m => avoidedMuscles.includes(m))) return false
    // Difficulty check
    if (!allowedDifficulties.includes(ex.difficulty)) return false
    // Wrist injury check
    if (answers.injuries.includes('wrists') && shouldExcludeForWristInjury(ex, hasAcuteWristInjury)) return false
    // Beginner safety check
    if (answers.fitnessLevel === 'complete-beginner' && !isBeginnerSafe(ex.name)) return false
    // Partner requirement check
    if (answers.hasTrainingPartner === 'no' && requiresPartner(ex.name)) return false
    return true
  })
  if (pool.length < 10) {
    pool = exerciseDb.filter(ex => {
      if (!(ex.equipment === 'bodyweight' || ex.equipment === 'none' || answers.availableEquipment.includes(ex.equipment))) return false
      if (avoidedMuscles.includes(ex.primaryMuscle)) return false
      if (!allowedDifficulties.includes(ex.difficulty)) return false
      if (answers.injuries.includes('wrists') && shouldExcludeForWristInjury(ex, hasAcuteWristInjury)) return false
      if (answers.fitnessLevel === 'complete-beginner' && !isBeginnerSafe(ex.name)) return false
      if (answers.hasTrainingPartner === 'no' && requiresPartner(ex.name)) return false
      return true
    })
  }

  const usedThisWeek = new Set<string>()
  const days: GeneratedDay[] = []
  const daysToGenerate = split.days.slice(0, sortedDays.length)

  // CARDIO STRATEGY:
  // If user selects cardio AND has tight time (<=30 min), reduce exercises per day to fit cardio
  // If user has loose time (>50 min), add cardio finishers
  const needsCardio = answers.cardioPreference !== 'none'
  let adjustedExerciseCount = exerciseCount
  let cardioCount = 0

  if (needsCardio) {
    if (answers.sessionDuration > 50) {
      // Plenty of time: add cardio finishers
      cardioCount = answers.cardioPreference === 'heavy' ? 2 : 1
    } else if (answers.sessionDuration <= 30) {
      // Tight time: reduce exercises by 1, add cardio finisher instead
      adjustedExerciseCount = Math.max(3, exerciseCount - 1)
      cardioCount = 1
    }
  }

  daysToGenerate.forEach((splitDay, i) => {
    const dayOfWeek = sortedDays[i]
    let targetMuscles = splitDay.muscles.filter(m => !avoidedMuscles.includes(m))
    // Intelligently distribute focus areas — only add to days where they belong
    // (e.g., triceps only to Push days, back only to Pull days)
    // Core frequency is smart: capped at 3-4x/week based on split
    const validFocusAreas = answers.focusAreas.filter(m => !avoidedMuscles.includes(m))
    targetMuscles = distributeFocusAreas(validFocusAreas, targetMuscles, answers.daysPerWeek, i, daysToGenerate)

    const majorTargets = targetMuscles.filter(m => MAJOR_MUSCLES.has(m))
    const minorTargets = targetMuscles.filter(m => !MAJOR_MUSCLES.has(m))
    // If user selected minor muscle as focus, treat it as major for this day
    const focusMinors = minorTargets.filter(m => answers.focusAreas.includes(m))

    const dayPool = pool.filter(ex =>
      targetMuscles.includes(ex.primaryMuscle) && !usedThisWeek.has(ex.id)
    )
    const scored = dayPool.map(ex => ({
      ex, score: scoreExercise(ex, answers.focusAreas, answers.familiarExercises, answers.comfortWithFreeWeights, usedExerciseIds, cautiousMuscles, answers.hasTrainingPartner, answers.hasAdjustableBench, answers.varietyPreference, answers.injuries, bodyComposition, answers.bodyType) + (shuffle ? Math.random() * 8 : 0)
    })).sort((a, b) => b.score - a.score)

    const selected: ExerciseData[] = []
    const muscleCount: Record<string, number> = {}
    const usedPatterns = new Set<string>()
    // Back needs 3 exercises (row + vertical pull + hinge), other muscles max 2
    const getMaxForMuscle = (m: string) => m === 'back' ? 3 : 2

    // Helper: can we add this exercise?
    const canAdd = (ex: ExerciseData): boolean => {
      if (selected.some(s => s.id === ex.id)) return false
      if ((muscleCount[ex.primaryMuscle] || 0) >= getMaxForMuscle(ex.primaryMuscle)) return false
      const pattern = getMovementPattern(ex)
      if (pattern !== 'other' && usedPatterns.has(pattern)) return false // NEW: no duplicate patterns
      return true
    }
    const addExercise = (ex: ExerciseData) => {
      selected.push(ex)
      muscleCount[ex.primaryMuscle] = (muscleCount[ex.primaryMuscle] || 0) + 1
      const pattern = getMovementPattern(ex)
      if (pattern !== 'other') usedPatterns.add(pattern)
    }

    // Reserve slots for focus minors so they don't get squeezed out
    const reservedForMinors = Math.min(focusMinors.length, 1)
    const mainSlots = adjustedExerciseCount - reservedForMinors

    // PHASE 1: One compound per MAJOR muscle (different movement patterns)
    // Back is special — it benefits from TWO compounds (a row + a pull) if slots allow
    for (const muscle of majorTargets) {
      if (selected.length >= Math.ceil(mainSlots * 0.6)) break
      const best = scored.find(s => s.ex.type === 'compound' && s.ex.primaryMuscle === muscle && canAdd(s.ex))
      if (best) addExercise(best.ex)
    }
    // Back gets a second compound if it only has one and there's a different pattern available
    if (muscleCount['back'] === 1 && selected.length < Math.ceil(mainSlots * 0.6)) {
      const secondBack = scored.find(s => s.ex.type === 'compound' && s.ex.primaryMuscle === 'back' && canAdd(s.ex))
      if (secondBack) addExercise(secondBack.ex)
    }

    // PHASE 2: One isolation per MAJOR muscle (provides stretch/variety)
    for (const muscle of majorTargets) {
      if (selected.length >= mainSlots) break
      if ((muscleCount[muscle] || 0) >= getMaxForMuscle(muscle)) continue
      const best = scored.find(s => s.ex.type === 'isolation' && s.ex.primaryMuscle === muscle && canAdd(s.ex))
      if (best) addExercise(best.ex)
    }

    // PHASE 3: Focus minor muscles — GUARANTEED slot (reserved above)
    for (const muscle of focusMinors) {
      if (selected.length >= adjustedExerciseCount) break
      const best = scored.find(s => s.ex.primaryMuscle === muscle && canAdd(s.ex))
      if (best) addExercise(best.ex)
    }

    // PHASE 4: Fill remaining — any muscle, different patterns, prefer unfilled muscles
    if (selected.length < adjustedExerciseCount) {
      const unfilled = [...majorTargets, ...focusMinors].filter(m => !muscleCount[m])
      const filled = majorTargets.filter(m => muscleCount[m])
      for (const muscle of [...unfilled, ...filled]) {
        if (selected.length >= adjustedExerciseCount) break
        const best = scored.find(s => s.ex.primaryMuscle === muscle && canAdd(s.ex))
        if (best) addExercise(best.ex)
      }
    }

    // PHASE 5: Absolute fill — still respects pattern constraints but allows any muscle
    if (selected.length < adjustedExerciseCount) {
      for (const { ex } of scored) {
        if (selected.length >= adjustedExerciseCount) break
        if (canAdd(ex)) addExercise(ex)
      }
    }

    selected.forEach(ex => usedThisWeek.add(ex.id))

    // Build exercise entries
    let exercises: GeneratedExercise[] = selected.map((ex, exIndex) => {
      const vol = getVolume(answers.fitnessLevel, answers.primaryGoal, answers.secondaryGoal, ex.type === 'compound', answers.bodyType)
      let { sets, reps } = vol
      let notes = ex.tips[0] || ''
      let isDurationBased = false
      let warmupSets: GeneratedExercise['warmupSets'] | undefined
      let rotationSchedule: GeneratedExercise['rotationSchedule'] | undefined

      if (isDurationBasedExercise(ex.name)) {
        reps = 30
        sets = 3
        isDurationBased = true
        notes = (notes ? notes + ' ' : '') + 'Perform for 30 seconds per set.'
      }

      // Reduce sets on secondary compounds (exIndex >= 2) to fit 45min target
      // Keep first 2 exercises at full volume, reduce secondary to 3 sets
      if (!isDurationBased && exIndex >= 2 && ex.type === 'compound' && sets > 3) {
        sets = 3
      }

      if (answers.fitnessLevel === 'complete-beginner' && ex.type === 'compound') notes = 'Focus on form over weight. ' + notes
      if (answers.primaryGoal === 'fat-loss' && !isDurationBased) {
        notes = (notes ? notes + ' ' : '') + 'Keep rest 30-60s.'
      }

      const restSec = getRestSeconds(answers.primaryGoal, answers.fitnessLevel, ex.type === 'compound', bodyComposition, answers.sessionDuration)

      // TIER 2: Smart warm-up for first compound exercise on the day only
      // (showing it on every exercise wastes space and confuses users)
      const isFirstCompound = exIndex === 0 && ex.type === 'compound' && !isDurationBased
      if (isFirstCompound && answers.fitnessLevel !== 'complete-beginner') {
        warmupSets = generateWarmupSets(ex.name)
        notes = (notes ? notes + ' ' : '') + 'Do warm-up sets first: 50%×8, 70%×5, 85%×2.'
      }

      // TIER 2: Smart rotation schedule for compounds
      if (ex.type === 'compound' && answers.timelineWeeks >= 8 && !isDurationBased) {
        const pattern = getMovementPattern(ex)
        rotationSchedule = createRotationSchedule(ex.id, pattern, answers.timelineWeeks, pool)
      }

      // Add RPE guidance only to first exercise of the day
      // Reduces visual clutter while keeping info accessible
      const week1RPE = getWeekRPE(1, answers.timelineWeeks, answers.primaryGoal)
      if (!isDurationBased && exIndex === 0 && (answers.fitnessLevel === 'regular-exerciser' || answers.fitnessLevel === 'some-experience')) {
        notes = (notes ? notes + ' ' : '') + `RPE ${week1RPE.min}-${week1RPE.max}: ${week1RPE.description}`
      }

      return {
        id: ex.id,
        name: ex.name,
        sets,
        reps,
        notes,
        restSeconds: restSec,
        isDurationBased: isDurationBased || false,
        warmupSets,
        rotationSchedule: rotationSchedule && rotationSchedule.length > 1 ? rotationSchedule : undefined
      }
    })

    exercises = sortExercises(exercises)

    if (cardioCount > 0) {
      const cardioPool = pool.filter(ex => CARDIO_EXERCISES.includes(ex.id) && !selected.some(s => s.id === ex.id))
      cardioPool.slice(0, cardioCount).forEach(ex => {
        exercises.push({ id: ex.id, name: ex.name, sets: 3, reps: 30, notes: 'Cardio finisher — perform for 30 seconds per set, minimal rest between sets.', restSeconds: 30, isDurationBased: true })
      })
    }

    days.push({
      dayName: WEEKDAY_LABELS[dayOfWeek] || dayOfWeek,
      splitName: splitDay.name,
      exercises,
      targetMuscles,
      estimatedMinutes: estimateDuration(exercises, answers.fitnessLevel, answers.primaryGoal, answers.warmupPreference, bodyComposition, answers.sessionDuration),
    })
  })

  const levelLabel = answers.fitnessLevel === 'complete-beginner' ? 'Beginner' : answers.fitnessLevel === 'some-experience' ? 'Intermediate' : 'Advanced'
  const goalLabel = GOAL_NAMES[answers.primaryGoal] || 'Fitness'
  const secondaryLabel = answers.secondaryGoal ? ` & ${SECONDARY_GOAL_NAMES[answers.secondaryGoal] || answers.secondaryGoal}` : ''
  const warmupNote = answers.warmupPreference === 'full' ? ' Start with 10 min warmup.' : answers.warmupPreference === 'quick' ? ' Start with 5 min warmup.' : ''

  // Describe cardio if included
  const cardioNote = needsCardio && (cardioCount > 0 || answers.cardioPreference !== 'none')
    ? ` ${answers.sessionDuration > 50 ? 'Includes cardio finishers.' : 'Incorporates cardio intervals.'}`
    : ''

  // Body composition note if available
  let bodyCompNote = ''
  if (bodyComposition) {
    if (bodyComposition.overriddenDueToBMI) {
      bodyCompNote = ' Safety-adjusted for your BMI: lower-impact exercises and extra rest included.'
    } else if (bodyComposition.impactTolerance === 'low') {
      bodyCompNote = ' Adapted for joint health: extra rest and lower-impact exercises chosen.'
    } else if (bodyComposition.bodyweightExerciseDifficulty > 1.1) {
      bodyCompNote = ' Optimized for your athletic build: includes challenging bodyweight progressions.'
    } else if (bodyComposition.bodyweightExerciseDifficulty < 0.9 && bodyComposition.relativeStrength === 'high') {
      bodyCompNote = ' Built for strength: tailored to your powerful frame with controlled progressions.'
    }
  }

  // Progression guidance
  let progressionNote = ''
  if (answers.timelineWeeks >= 8) {
    // Strategic progression for longer timelines
    if (answers.primaryGoal === 'strength') {
      progressionNote = ' Progress: Weeks 1-4 build foundation (learn form, 6-7 RPE), weeks 5-11 push intensity (add weight each session, 7-9 RPE), week 12 deload and retest.'
    } else if (answers.primaryGoal === 'muscle-building' || answers.primaryGoal === 'toning') {
      progressionNote = ' Progress: Weeks 1-4 build form, weeks 5-11 increase volume and weight, week 12 reduce volume and recover.'
    } else {
      progressionNote = ' Progress: Add weight when you hit top of rep range (e.g., 12 reps easy → add 5%). Final week: reduce load 40-50% to recover.'
    }
  }

  // Audit volume balance (helpful for understanding coverage)
  const volumeAudit = auditVolumeBalance(days)
  const imbalancedMuscles = volumeAudit.filter(m => m.status !== 'balanced')
  let volumeNote = ''
  if (imbalancedMuscles.length > 0) {
    const lowVol = imbalancedMuscles.filter(m => m.status === 'low').map(m => m.muscle).slice(0, 2)
    if (lowVol.length > 0) {
      volumeNote = ` Note: ${lowVol.join(', ')} are lightly trained — consider adding variety week-to-week.`
    }
  }

  // Check for critical imbalances (push/pull, quad/hamstring)
  const pushPullBalance = checkPushPullBalance(days)
  const legBalance = checkLegBalance(days)
  let balanceWarnings = ''
  if (!pushPullBalance.balanced) {
    balanceWarnings += ' ⚠️ ' + pushPullBalance.issues[0]
  }
  if (!legBalance.balanced) {
    balanceWarnings += ' ⚠️ ' + legBalance.issues[0]
  }

  // Build deload week guidance
  let deloadNote = ''
  if (answers.timelineWeeks >= 8) {
    deloadNote = ` Final week (${answers.timelineWeeks}): Deload — reduce volume 40-50%, maintain movement quality.`
  }

  // Check for rotation schedules (Tier 2)
  const hasRotation = days.some(day =>
    day.exercises.some(ex => ex.rotationSchedule && ex.rotationSchedule.length > 1)
  )
  let rotationNote = ''
  if (hasRotation && answers.timelineWeeks >= 8) {
    rotationNote = ' Exercises rotate every 3 weeks to prevent plateaus and boredom — see each exercise for rotation schedule.'
  }

  // Check for warm-ups (Tier 2)
  const hasWarmup = days.some(day =>
    day.exercises.some(ex => ex.warmupSets && ex.warmupSets.length > 0)
  )
  let warmupProtocolNote = ''
  if (hasWarmup) {
    warmupProtocolNote = ' Each day: Do warm-up sets (50%×8, 70%×5, 85%×2) before first compound lift.'
  }

  // Add RPE guide for clarity
  let rpeGuideNote = ' RPE Guide: 6 = 4 reps left in tank, 7 = 3 reps left, 8 = 2 reps left, 9 = 1 rep left (near failure).'

  // Generate weekly progression guidance (Tier 3)
  const weeklyProgression = Array.from({ length: answers.timelineWeeks }, (_, i) => {
    const weekNumber = i + 1
    const rpe = getWeekRPE(weekNumber, answers.timelineWeeks, answers.primaryGoal)
    return {
      week: weekNumber,
      rpeMin: rpe.min,
      rpeMax: rpe.max,
      phase: rpe.description.split(':')[0],
      description: rpe.description,
    }
  })

  return {
    name: '',
    description: `${split.type} ${goalLabel}${secondaryLabel} program. ${answers.daysPerWeek} days/week, ~${answers.sessionDuration} min sessions.${warmupNote}${cardioNote}${bodyCompNote}${progressionNote}${deloadNote}${rpeGuideNote}${rotationNote}${warmupProtocolNote}${balanceWarnings}${volumeNote}${answers.primaryGoal === 'flexibility' || answers.secondaryGoal === 'flexibility' ? ' Add 5-10 min stretching after each session.' : ''}`,
    days,
    splitType: split.type,
    weeklyProgression,
  }
}
