import { exercises as exerciseDb, type ExerciseData, type MuscleGroup, type Difficulty } from '../data/exercises'
import { getExerciseCategory } from '../data/exerciseCategories'
import type { OnboardingAnswers } from '../store/onboardingStore'

export interface GeneratedExercise {
  id: string
  name: string
  sets: number
  reps: number
  notes: string
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

// Split definitions
const SPLIT_CONFIG: Record<number, { type: string; days: { name: string; muscles: MuscleGroup[] }[] }> = {
  2: {
    type: 'Full Body',
    days: [
      { name: 'Full Body A', muscles: ['chest', 'back', 'shoulders', 'quads', 'core'] },
      { name: 'Full Body B', muscles: ['back', 'glutes', 'hamstrings', 'shoulders', 'biceps', 'triceps', 'core'] },
    ]
  },
  3: {
    type: 'Push / Pull / Legs',
    days: [
      { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull', muscles: ['back', 'biceps', 'traps', 'forearms'] },
      { name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
    ]
  },
  4: {
    type: 'Upper / Lower',
    days: [
      { name: 'Upper A', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { name: 'Lower A', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
      { name: 'Upper B', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { name: 'Lower B', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
    ]
  },
  5: {
    type: '5-Day Split',
    days: [
      { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull', muscles: ['back', 'biceps', 'traps', 'forearms'] },
      { name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
      { name: 'Upper', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { name: 'Lower', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
    ]
  },
  6: {
    type: 'PPL × 2',
    days: [
      { name: 'Push A', muscles: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull A', muscles: ['back', 'biceps', 'traps', 'forearms'] },
      { name: 'Legs A', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
      { name: 'Push B', muscles: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull B', muscles: ['back', 'biceps', 'traps', 'forearms'] },
      { name: 'Legs B', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
    ]
  },
}

const INJURY_MAP: Record<string, MuscleGroup[]> = {
  shoulders: ['shoulders'],
  'back-spine': ['back', 'traps'],
  knees: ['quads', 'hamstrings'],
  wrists: ['forearms'],
  hips: ['glutes', 'hamstrings'],
  ankles: ['calves'],
  neck: ['traps'],
}

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const WEEKDAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

// Equipment weight order for sorting (heaviest first)
const EQUIPMENT_ORDER: Record<string, number> = {
  barbell: 1, 'smith-machine': 2, dumbbell: 3, 'ez-bar': 4,
  kettlebell: 5, cable: 6, machine: 7, bodyweight: 8, band: 9, 'pull-up-bar': 8, none: 10,
}

// Cardio-style exercises for conditioning finishers
const CARDIO_EXERCISES = [
  'mountain-climber', 'kettlebell-swing', 'bear-crawl', 'walking-lunge',
  'band-squat', 'goblet-squat', 'barbell-lunge', 'flutter-kick',
]

function getAvoidedMuscles(injuries: string[], severity: Record<string, string>): MuscleGroup[] {
  const avoided = new Set<MuscleGroup>()
  injuries.forEach(injury => {
    if (!severity[injury] || severity[injury] === 'acute') {
      (INJURY_MAP[injury] || []).forEach(m => avoided.add(m))
    }
  })
  return Array.from(avoided)
}

function getCautiousMuscles(injuries: string[], severity: Record<string, string>): MuscleGroup[] {
  const cautious = new Set<MuscleGroup>()
  injuries.forEach(injury => {
    if (severity[injury] === 'chronic') {
      (INJURY_MAP[injury] || []).forEach(m => cautious.add(m))
    }
  })
  return Array.from(cautious)
}

function getAllowedDifficulties(complexity: string): Difficulty[] {
  if (complexity === 'simple') return ['beginner']
  if (complexity === 'moderate') return ['beginner', 'intermediate']
  return ['beginner', 'intermediate', 'advanced']
}

// Rest time based on GOAL (not just fitness level)
function getRestSeconds(goal: string, level: string): number {
  if (goal === 'strength') return level === 'complete-beginner' ? 150 : 120
  if (goal === 'muscle-building') return 75
  if (goal === 'toning') return 60
  if (goal === 'fat-loss') return 45
  if (goal === 'endurance') return 30
  return 60 // general fitness
}

// Work BACKWARDS from target duration to get exercise count
function getExerciseCount(targetDuration: number, level: string, goal: string): number {
  const warmup = level === 'complete-beginner' ? 10 : 5
  const cooldown = 5
  const available = targetDuration - warmup - cooldown

  const restSec = getRestSeconds(goal, level)
  const avgSets = goal === 'strength' ? 4 : 3
  // Time per exercise: sets × 1.5min per set + (sets-1) × rest between sets
  const timePerEx = (avgSets * 1.5) + ((avgSets - 1) * restSec / 60)

  const count = Math.floor(available / timePerEx)
  return Math.max(3, Math.min(count, 10)) // clamp 3-10
}

// Volume: primary goal drives, secondary goal nudges
function getVolume(level: string, primaryGoal: string, secondaryGoal: string, isCompound: boolean): { sets: number; reps: number } {
  let sets = 3
  let reps = 10

  // Base by level
  if (level === 'complete-beginner') {
    sets = 3; reps = isCompound ? 10 : 12
  } else if (level === 'some-experience') {
    sets = isCompound ? 3 : 3; reps = isCompound ? 8 : 10
  } else {
    sets = isCompound ? 4 : 3; reps = isCompound ? 6 : 10
  }

  // Primary goal (full effect)
  if (primaryGoal === 'strength') { reps = Math.max(reps - 2, 4); sets = Math.min(sets + 1, 5) }
  if (primaryGoal === 'fat-loss') { reps = Math.min(reps + 3, 15) }
  if (primaryGoal === 'toning') { reps = Math.min(reps + 2, 15); sets = 3 }
  if (primaryGoal === 'endurance') { reps = Math.min(reps + 5, 20); sets = Math.max(sets - 1, 2) }
  if (primaryGoal === 'muscle-building') { reps = Math.min(Math.max(reps, 8), 12); sets = Math.max(sets, 3) }

  // Secondary goal (half effect — nudge towards it)
  if (secondaryGoal === 'strength') { reps = Math.max(reps - 1, 4) }
  if (secondaryGoal === 'fat-loss') { reps = Math.min(reps + 1, 18) }
  if (secondaryGoal === 'endurance') { reps = Math.min(reps + 2, 20) }
  if (secondaryGoal === 'muscle-building' && reps < 8) { reps = 8 }
  if (secondaryGoal === 'toning') { reps = Math.min(reps + 1, 15) }

  return { sets, reps }
}

function scoreExercise(
  ex: ExerciseData,
  focusAreas: MuscleGroup[],
  familiarExercises: string[],
  comfort: string,
  usedIds: string[],
  cautiousMuscles: MuscleGroup[],
  hasPartner: string,
  hasBench: boolean,
  varietyPref: string,
): number {
  let score = 0
  if (focusAreas.includes(ex.primaryMuscle)) score += 6
  if (ex.type === 'compound') score += 4
  const lower = ex.name.toLowerCase()
  if (familiarExercises.some(f => lower.includes(f.toLowerCase()))) score += 3

  // Category scoring based on variety preference
  const category = getExerciseCategory(ex.id)
  if (varietyPref === 'routine') {
    // Strongly prefer staples, avoid unique
    if (category === 'staple') score += 8
    if (category === 'unique') score -= 4
  } else if (varietyPref === 'variety') {
    // Mix it up — bonus for unique, slight penalty for always picking staples
    if (category === 'unique') score += 5
    if (category === 'staple') score += 2
  } else {
    // Balanced — prefer staples but sprinkle in some unique
    if (category === 'staple') score += 5
    if (category === 'unique') score += 1
  }

  if (comfort === 'yes') {
    // Comfortable with free weights — prefer them for compounds (better loading)
    if (ex.type === 'compound' && (ex.equipment === 'barbell' || ex.equipment === 'dumbbell')) score += 3
  } else if (comfort === 'somewhat') {
    if (ex.equipment === 'barbell') score -= 2
    if (ex.equipment === 'dumbbell') score += 1
  } else {
    // Not yet comfortable — prefer machines and bodyweight
    if (ex.equipment === 'barbell' || ex.equipment === 'ez-bar') score -= 6
    if (ex.equipment === 'machine' || ex.equipment === 'cable') score += 3
    if (ex.equipment === 'bodyweight') score += 2
  }

  if (hasPartner === 'no' && ex.equipment === 'barbell' && ex.type === 'compound') score -= 2

  if (!hasBench) {
    if (lower.includes('incline') || lower.includes('decline') || lower.includes('chest-supported') || lower.includes('spider') || lower.includes('seal row')) score -= 8
  }

  if (usedIds.includes(ex.id)) score -= 5
  if (cautiousMuscles.includes(ex.primaryMuscle) && ex.type === 'compound') score -= 3

  score += Math.random() * 2
  return score
}

// Sort exercises in proper training order: heavy compounds → lighter compounds → isolations
function sortExercises(exercises: GeneratedExercise[], exerciseDb: ExerciseData[]): GeneratedExercise[] {
  return exercises.sort((a, b) => {
    const infoA = exerciseDb.find(e => e.id === a.id)
    const infoB = exerciseDb.find(e => e.id === b.id)
    if (!infoA || !infoB) return 0

    // Compounds before isolations
    if (infoA.type !== infoB.type) return infoA.type === 'compound' ? -1 : 1

    // Within same type, sort by equipment weight (barbell first)
    const orderA = EQUIPMENT_ORDER[infoA.equipment] || 10
    const orderB = EQUIPMENT_ORDER[infoB.equipment] || 10
    return orderA - orderB
  })
}

function estimateDuration(exercises: GeneratedExercise[], level: string, goal: string, warmup: string): number {
  const restSec = getRestSeconds(goal, level)
  const warmupMins = warmup === 'full' ? 10 : warmup === 'quick' ? 5 : 0
  let total = warmupMins + 5 // + cooldown
  exercises.forEach(ex => {
    total += (ex.sets * 1.5) + ((ex.sets - 1) * restSec / 60)
  })
  return Math.round(total)
}

export function generatePlan(answers: OnboardingAnswers, usedExerciseIds: string[] = []): GeneratedPlan {
  const split = SPLIT_CONFIG[answers.daysPerWeek] || SPLIT_CONFIG[3]
  const avoidedMuscles = getAvoidedMuscles(answers.injuries, answers.injurySeverity)
  const cautiousMuscles = getCautiousMuscles(answers.injuries, answers.injurySeverity)
  const allowedDifficulties = getAllowedDifficulties(answers.exerciseComplexity)
  const exerciseCount = getExerciseCount(answers.sessionDuration, answers.fitnessLevel, answers.primaryGoal)

  const sortedDays = [...answers.specificDays].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))

  // Filter exercise pool
  let pool = exerciseDb.filter(ex =>
    (ex.equipment === 'bodyweight' || ex.equipment === 'none' || answers.availableEquipment.includes(ex.equipment)) &&
    !avoidedMuscles.includes(ex.primaryMuscle) &&
    !ex.secondaryMuscles.some(m => avoidedMuscles.includes(m)) &&
    allowedDifficulties.includes(ex.difficulty)
  )

  if (pool.length < 10) {
    pool = exerciseDb.filter(ex =>
      (ex.equipment === 'bodyweight' || ex.equipment === 'none' || answers.availableEquipment.includes(ex.equipment)) &&
      !avoidedMuscles.includes(ex.primaryMuscle) &&
      allowedDifficulties.includes(ex.difficulty)
    )
  }

  const usedThisWeek = new Set<string>()
  const days: GeneratedDay[] = []
  const daysToGenerate = split.days.slice(0, sortedDays.length)

  // How many cardio finishers to add
  const cardioCount = answers.cardioPreference === 'heavy' ? 2 : answers.cardioPreference === 'moderate' ? 1 : 0

  daysToGenerate.forEach((splitDay, i) => {
    const dayOfWeek = sortedDays[i]
    const targetMuscles = splitDay.muscles.filter(m => !avoidedMuscles.includes(m))

    const dayPool = pool.filter(ex =>
      targetMuscles.includes(ex.primaryMuscle) && !usedThisWeek.has(ex.id)
    )

    const scored = dayPool.map(ex => ({
      ex,
      score: scoreExercise(ex, answers.focusAreas, answers.familiarExercises, answers.comfortWithFreeWeights, usedExerciseIds, cautiousMuscles, answers.hasTrainingPartner, answers.hasAdjustableBench, answers.varietyPreference)
    })).sort((a, b) => b.score - a.score)

    const selected: ExerciseData[] = []
    const muscleCount: Record<string, number> = {} // track exercises per muscle
    const MAX_PER_MUSCLE = 2

    // Reserve slots: ~60% compounds, ~40% isolations (minimum 1 isolation)
    const compoundSlots = Math.max(1, Math.ceil(exerciseCount * 0.6))
    const isolationSlots = exerciseCount - compoundSlots

    // PHASE 1: Compounds — one per major target muscle, up to compound slot limit
    // Prioritize the first muscles listed (they're ordered by importance in split config)
    for (const muscle of targetMuscles) {
      if (selected.length >= compoundSlots) break
      const best = scored.find(s =>
        s.ex.type === 'compound' &&
        s.ex.primaryMuscle === muscle &&
        !selected.some(sel => sel.id === s.ex.id)
      )
      if (best) {
        selected.push(best.ex)
        muscleCount[muscle] = (muscleCount[muscle] || 0) + 1
      }
    }

    // PHASE 2: Isolations — one per target muscle that needs coverage
    // Prioritize muscles that don't have an exercise yet, then fill remaining
    const uncoveredMuscles = targetMuscles.filter(m => !muscleCount[m])
    const coveredMuscles = targetMuscles.filter(m => muscleCount[m])
    const isolationOrder = [...uncoveredMuscles, ...coveredMuscles]

    for (const muscle of isolationOrder) {
      if (selected.length >= exerciseCount) break
      if ((muscleCount[muscle] || 0) >= MAX_PER_MUSCLE) continue
      const best = scored.find(s =>
        (s.ex.type === 'isolation' || !muscleCount[muscle]) && // allow compound if muscle has nothing
        s.ex.primaryMuscle === muscle &&
        !selected.some(sel => sel.id === s.ex.id)
      )
      if (best) {
        selected.push(best.ex)
        muscleCount[muscle] = (muscleCount[muscle] || 0) + 1
      }
    }

    // PHASE 3: Fill remaining slots — any exercise, respect max per muscle
    const remaining = scored.filter(s =>
      !selected.some(sel => sel.id === s.ex.id) &&
      (muscleCount[s.ex.primaryMuscle] || 0) < MAX_PER_MUSCLE
    )
    for (const { ex } of remaining) {
      if (selected.length >= exerciseCount) break
      selected.push(ex)
      muscleCount[ex.primaryMuscle] = (muscleCount[ex.primaryMuscle] || 0) + 1
    }

    // PHASE 4: Fallback if still short
    if (selected.length < 3) {
      const fallback = pool.filter(ex =>
        !usedThisWeek.has(ex.id) && !selected.some(s => s.id === ex.id)
      ).slice(0, Math.max(3, exerciseCount) - selected.length)
      selected.push(...fallback)
    }

    selected.forEach(ex => usedThisWeek.add(ex.id))

    // Build exercise entries with volume
    let exercises: GeneratedExercise[] = selected.map(ex => {
      const vol = getVolume(answers.fitnessLevel, answers.primaryGoal, answers.secondaryGoal, ex.type === 'compound')
      let { sets, reps } = vol
      let notes = ex.tips[0] || ''

      // Timed exercises: use seconds instead of reps
      const lower = ex.name.toLowerCase()
      const isTimed = lower.includes('plank') || lower.includes('hold') || lower === 'dead hang' || lower.includes('wall sit')
      const isCardioStyle = lower.includes('mountain climber') || lower.includes('bear crawl') || lower.includes('burpee') || lower.includes('flutter')
      if (isTimed) {
        reps = 30 // 30 seconds
        sets = 3
        notes = (notes ? notes + ' ' : '') + 'Hold for ' + reps + ' seconds per set.'
      } else if (isCardioStyle) {
        reps = 30 // 30 seconds
        sets = 3
        notes = (notes ? notes + ' ' : '') + 'Perform for ' + reps + ' seconds per set.'
      }

      if (answers.fitnessLevel === 'complete-beginner' && ex.type === 'compound') {
        notes = 'Focus on form over weight. ' + notes
      }
      if (answers.primaryGoal === 'fat-loss' && !isTimed && !isCardioStyle) {
        notes = (notes ? notes + ' ' : '') + 'Keep rest 30-60s.'
      }
      return { id: ex.id, name: ex.name, sets, reps, notes }
    })

    // Sort: heavy compounds first → lighter → isolations last
    exercises = sortExercises(exercises, exerciseDb)

    // Add warmup at the START if user wants it
    if (answers.warmupPreference !== 'none') {
      const warmupExercises: GeneratedExercise[] = []
      // Pick 1-2 light movements related to today's muscles
      const warmupCandidates = pool.filter(ex =>
        ex.equipment === 'bodyweight' && ex.difficulty === 'beginner' &&
        targetMuscles.includes(ex.primaryMuscle) &&
        !selected.some(s => s.id === ex.id)
      )
      const warmupCount = answers.warmupPreference === 'full' ? 2 : 1
      warmupCandidates.slice(0, warmupCount).forEach(ex => {
        warmupExercises.push({
          id: ex.id, name: ex.name, sets: 2, reps: 12,
          notes: 'Warm-up — light weight, focus on range of motion.',
        })
      })
      exercises = [...warmupExercises, ...exercises]
    }

    // Add cardio finishers if requested
    if (cardioCount > 0) {
      const cardioPool = pool.filter(ex =>
        CARDIO_EXERCISES.includes(ex.id) && !selected.some(s => s.id === ex.id)
      )
      const cardioExercises = cardioPool.slice(0, cardioCount).map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: 3,
        reps: answers.primaryGoal === 'endurance' ? 20 : 15,
        notes: 'Cardio finisher — minimal rest between sets.',
      }))
      exercises.push(...cardioExercises)
    }

    days.push({
      dayName: WEEKDAY_LABELS[dayOfWeek] || dayOfWeek,
      splitName: splitDay.name,
      exercises,
      targetMuscles,
      estimatedMinutes: estimateDuration(exercises, answers.fitnessLevel, answers.primaryGoal, answers.warmupPreference),
    })
  })

  // Better plan naming
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

  return {
    name: '',
    description: `${split.type} ${goalLabel}${secondaryLabel} program. ${answers.daysPerWeek} days/week, ~${answers.sessionDuration} min sessions.${answers.cardioPreference !== 'none' ? ` Includes cardio finishers.` : ''}`,
    days,
    splitType: split.type,
  }
}
