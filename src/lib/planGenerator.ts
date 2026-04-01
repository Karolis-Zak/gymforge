import { exercises as exerciseDb, type ExerciseData, type MuscleGroup, type Difficulty } from '../data/exercises'
import { getExerciseCategory } from '../data/exerciseCategories'
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
}

// Major muscles get dedicated exercise slots
const MAJOR_MUSCLES: Set<MuscleGroup> = new Set(['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps'])

function roundToStandardReps(reps: number): number {
  const standards = [4, 5, 6, 8, 10, 12, 15, 20]
  return standards.reduce((prev, curr) => Math.abs(curr - reps) < Math.abs(prev - reps) ? curr : prev)
}

function isTimedExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('plank') || lower.includes('hold') || lower === 'dead hang' || lower.includes('wall sit')
}

function isCarryExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('farmer') || lower.includes('carry') || lower.includes('suitcase')
}

function isCardioStyleExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('mountain climber') || lower.includes('bear crawl') || lower.includes('flutter')
}

// Movement pattern detection — prevents picking two exercises of the same pattern
function getMovementPattern(ex: ExerciseData): string {
  const lower = ex.name.toLowerCase()
  // Check curl FIRST (before overhead — "Overhead Cable Curl" is a curl not a press)
  if (lower.includes('curl') && ex.primaryMuscle === 'biceps') return 'curl'
  // Check leg curl separately (hamstring curl is NOT a bicep curl)
  if (lower.includes('curl') && ex.primaryMuscle === 'hamstrings') return 'leg-curl'
  // Presses (horizontal push)
  if (lower.includes('bench press') || lower.includes('chest press') || lower.includes('floor press')) return 'horizontal-press'
  // Overhead press (vertical push)
  if (lower.includes('overhead') || lower.includes('shoulder press') || lower.includes('military') || lower.includes('arnold')) return 'overhead-press'
  // Rows (horizontal pull)
  if (lower.includes('row') && !lower.includes('upright')) return 'row'
  // Vertical pull
  if (lower.includes('pulldown') || lower.includes('pull-up') || lower.includes('chin-up') || lower.includes('pull up')) return 'vertical-pull'
  // Squat pattern
  if (lower.includes('squat') || lower.includes('leg press')) return 'squat'
  // Hip hinge
  if (lower.includes('deadlift') || lower.includes('rdl') || lower.includes('good morning') || lower.includes('hip thrust')) return 'hip-hinge'
  // Tricep extension pattern
  if (lower.includes('pushdown') || lower.includes('extension') || lower.includes('skull')) return 'tricep-extension'
  // Fly/stretch pattern
  if (lower.includes('fly') || lower.includes('flye') || lower.includes('crossover') || lower.includes('pullover')) return 'fly-stretch'
  // Lateral raise
  if (lower.includes('lateral raise') || lower.includes('front raise') || lower.includes('rear delt')) return 'raise'
  // Lunge pattern
  if (lower.includes('lunge') || lower.includes('split squat') || lower.includes('step-up')) return 'lunge'
  // Shrug pattern
  if (lower.includes('shrug')) return 'shrug'
  // Wrist curl pattern
  if (lower.includes('wrist curl') || lower.includes('wrist extension')) return 'wrist-curl'
  // Push-up / dip pattern
  if (lower.includes('push-up') || lower.includes('dip')) return 'bodyweight-push'
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
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const WEEKDAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}
const EQUIPMENT_ORDER: Record<string, number> = {
  barbell: 1, 'smith-machine': 2, dumbbell: 3, 'ez-bar': 4,
  kettlebell: 5, cable: 6, machine: 7, bodyweight: 8, band: 9, 'pull-up-bar': 8, none: 10,
}
const CARDIO_EXERCISES = ['mountain-climber', 'bear-crawl', 'flutter-kick', 'band-squat']

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

function getRestSeconds(goal: string, level: string, composition?: BodyComposition): number {
  // Heavier/less fit people need more rest for joint recovery
  const extraRest = composition && composition.impactTolerance === 'low' ? 15 : 0

  if (level === 'complete-beginner') return 75 + extraRest
  if (level === 'some-experience') {
    if (goal === 'strength') return 90 + extraRest
    if (goal === 'fat-loss' || goal === 'endurance') return 45 + extraRest
    return 60 + extraRest
  }
  if (goal === 'strength') return 120 + extraRest
  if (goal === 'muscle-building') return 75 + extraRest
  if (goal === 'toning') return 60 + extraRest
  if (goal === 'fat-loss') return 45 + extraRest
  if (goal === 'endurance') return 30 + extraRest
  return 60 + extraRest
}

function getExerciseCount(targetDuration: number, level: string, goal: string, composition?: BodyComposition): number {
  const warmup = level === 'complete-beginner' ? 8 : 5
  const available = targetDuration - warmup - 3
  const restSec = getRestSeconds(goal, level, composition)
  const avgSets = level === 'complete-beginner' ? 3 : (goal === 'strength' ? 4 : 3)
  const timePerEx = (avgSets * 1.5) + ((avgSets - 1) * restSec / 60)
  const min = targetDuration <= 30 ? 4 : 5
  const max = goal === 'endurance' ? 8 : 10
  return Math.max(min, Math.min(Math.round(available / timePerEx), max))
}

function getVolume(level: string, primaryGoal: string, secondaryGoal: string, isCompound: boolean): { sets: number; reps: number } {
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

  reps = roundToStandardReps(reps)
  return { sets, reps }
}

// Detect exercises that require a training partner
function requiresPartner(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('leg curl') && (lower.includes('dumbbell') || lower.includes('band'))
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
  hasPartner: string, hasBench: boolean, varietyPref: string, injuries: string[] = [],
  bodyComposition?: BodyComposition,
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

  if (isTimedExercise(ex.name) || isCarryExercise(ex.name)) score -= 6

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

function estimateDuration(exercises: GeneratedExercise[], level: string, goal: string, warmup: string, composition?: BodyComposition): number {
  const restSec = getRestSeconds(goal, level, composition)
  const warmupMins = warmup === 'full' ? 10 : warmup === 'quick' ? 5 : 0
  let total = warmupMins + 3
  exercises.forEach(ex => {
    const isTimed = ex.notes?.includes('seconds')
    if (isTimed) {
      // Timed exercise: 30sec per set + rest between sets
      total += (ex.sets * 0.5) + ((ex.sets - 1) * restSec / 60)
    } else {
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

  let pool = exerciseDb.filter(ex =>
    (ex.equipment === 'bodyweight' || ex.equipment === 'none' || answers.availableEquipment.includes(ex.equipment)) &&
    !avoidedMuscles.includes(ex.primaryMuscle) &&
    !ex.secondaryMuscles.some(m => avoidedMuscles.includes(m)) &&
    allowedDifficulties.includes(ex.difficulty) &&
    !(answers.injuries.includes('wrists') && shouldExcludeForWristInjury(ex, hasAcuteWristInjury))
  )
  if (pool.length < 10) {
    pool = exerciseDb.filter(ex =>
      (ex.equipment === 'bodyweight' || ex.equipment === 'none' || answers.availableEquipment.includes(ex.equipment)) &&
      !avoidedMuscles.includes(ex.primaryMuscle) && allowedDifficulties.includes(ex.difficulty) &&
      !(answers.injuries.includes('wrists') && shouldExcludeForWristInjury(ex, hasAcuteWristInjury))
    )
  }

  const usedThisWeek = new Set<string>()
  const days: GeneratedDay[] = []
  const daysToGenerate = split.days.slice(0, sortedDays.length)
  // Only add cardio finishers if there's time in the session (>50 min with warmup)
  const canAddCardio = answers.sessionDuration > 50
  const cardioCount = canAddCardio && answers.cardioPreference === 'heavy' ? 2 : canAddCardio && answers.cardioPreference === 'moderate' ? 1 : 0

  daysToGenerate.forEach((splitDay, i) => {
    const dayOfWeek = sortedDays[i]
    const targetMuscles = splitDay.muscles.filter(m => !avoidedMuscles.includes(m))
    const majorTargets = targetMuscles.filter(m => MAJOR_MUSCLES.has(m))
    const minorTargets = targetMuscles.filter(m => !MAJOR_MUSCLES.has(m))
    // If user selected minor muscle as focus, treat it as major for this day
    const focusMinors = minorTargets.filter(m => answers.focusAreas.includes(m))

    const dayPool = pool.filter(ex =>
      targetMuscles.includes(ex.primaryMuscle) && !usedThisWeek.has(ex.id)
    )
    const scored = dayPool.map(ex => ({
      ex, score: scoreExercise(ex, answers.focusAreas, answers.familiarExercises, answers.comfortWithFreeWeights, usedExerciseIds, cautiousMuscles, answers.hasTrainingPartner, answers.hasAdjustableBench, answers.varietyPreference, answers.injuries, bodyComposition) + (shuffle ? Math.random() * 8 : 0)
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
    const mainSlots = exerciseCount - reservedForMinors

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
      if (selected.length >= exerciseCount) break
      const best = scored.find(s => s.ex.primaryMuscle === muscle && canAdd(s.ex))
      if (best) addExercise(best.ex)
    }

    // PHASE 4: Fill remaining — any muscle, different patterns, prefer unfilled muscles
    if (selected.length < exerciseCount) {
      const unfilled = [...majorTargets, ...focusMinors].filter(m => !muscleCount[m])
      const filled = majorTargets.filter(m => muscleCount[m])
      for (const muscle of [...unfilled, ...filled]) {
        if (selected.length >= exerciseCount) break
        const best = scored.find(s => s.ex.primaryMuscle === muscle && canAdd(s.ex))
        if (best) addExercise(best.ex)
      }
    }

    // PHASE 5: Absolute fill — still respects pattern constraints but allows any muscle
    if (selected.length < exerciseCount) {
      for (const { ex } of scored) {
        if (selected.length >= exerciseCount) break
        if (canAdd(ex)) addExercise(ex)
      }
    }

    selected.forEach(ex => usedThisWeek.add(ex.id))

    // Build exercise entries
    let exercises: GeneratedExercise[] = selected.map(ex => {
      const vol = getVolume(answers.fitnessLevel, answers.primaryGoal, answers.secondaryGoal, ex.type === 'compound')
      let { sets, reps } = vol
      let notes = ex.tips[0] || ''

      if (isTimedExercise(ex.name)) { reps = 30; sets = 3; notes = (notes ? notes + ' ' : '') + 'Hold for 30 seconds per set.' }
      else if (isCarryExercise(ex.name)) { reps = 30; sets = 3; notes = (notes ? notes + ' ' : '') + 'Walk for 30 seconds per set.' }
      else if (isCardioStyleExercise(ex.name)) { reps = 30; sets = 3; notes = (notes ? notes + ' ' : '') + 'Perform for 30 seconds per set.' }

      if (answers.fitnessLevel === 'complete-beginner' && ex.type === 'compound') notes = 'Focus on form over weight. ' + notes
      if (answers.primaryGoal === 'fat-loss' && !isTimedExercise(ex.name) && !isCarryExercise(ex.name) && !isCardioStyleExercise(ex.name)) {
        notes = (notes ? notes + ' ' : '') + 'Keep rest 30-60s.'
      }
      const restSec = getRestSeconds(answers.primaryGoal, answers.fitnessLevel, bodyComposition)
      return { id: ex.id, name: ex.name, sets, reps, notes, restSeconds: restSec }
    })

    exercises = sortExercises(exercises)

    if (cardioCount > 0) {
      const cardioPool = pool.filter(ex => CARDIO_EXERCISES.includes(ex.id) && !selected.some(s => s.id === ex.id))
      cardioPool.slice(0, cardioCount).forEach(ex => {
        exercises.push({ id: ex.id, name: ex.name, sets: 3, reps: 15, notes: 'Cardio finisher — minimal rest between sets.', restSeconds: 30 })
      })
    }

    days.push({
      dayName: WEEKDAY_LABELS[dayOfWeek] || dayOfWeek,
      splitName: splitDay.name,
      exercises,
      targetMuscles,
      estimatedMinutes: estimateDuration(exercises, answers.fitnessLevel, answers.primaryGoal, answers.warmupPreference, bodyComposition),
    })
  })

  const levelLabel = answers.fitnessLevel === 'complete-beginner' ? 'Beginner' : answers.fitnessLevel === 'some-experience' ? 'Intermediate' : 'Advanced'
  const goalNames: Record<string, string> = {
    'strength': 'Strength', 'muscle-building': 'Muscle Building', 'toning': 'Tone & Define',
    'fat-loss': 'Fat Burn', 'general-fitness': 'Fitness', 'endurance': 'Endurance', 'flexibility': 'Flexibility',
  }
  const secondaryNames: Record<string, string> = {
    'strength': 'Strength', 'fat-loss': 'Conditioning', 'muscle-building': 'Hypertrophy',
    'toning': 'Toning', 'endurance': 'Endurance',
  }
  const goalLabel = goalNames[answers.primaryGoal] || 'Fitness'
  const secondaryLabel = answers.secondaryGoal ? ` & ${secondaryNames[answers.secondaryGoal] || answers.secondaryGoal}` : ''
  const warmupNote = answers.warmupPreference === 'full' ? ' Start with 10 min warmup.' : answers.warmupPreference === 'quick' ? ' Start with 5 min warmup.' : ''

  // Only claim cardio finishers if there's room in the session (>50 min with warmup)
  const hasTimeForCardio = answers.sessionDuration > 50 && answers.cardioPreference !== 'none'
  const cardioNote = hasTimeForCardio ? ' Includes cardio finishers.' : ''

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

  return {
    name: '',
    description: `${split.type} ${goalLabel}${secondaryLabel} program. ${answers.daysPerWeek} days/week, ~${answers.sessionDuration} min sessions.${warmupNote}${cardioNote}${bodyCompNote}${answers.primaryGoal === 'flexibility' || answers.secondaryGoal === 'flexibility' ? ' Add 5-10 min stretching after each session.' : ''}`,
    days,
    splitType: split.type,
  }
}
