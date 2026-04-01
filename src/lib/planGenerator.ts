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

function getRestSeconds(goal: string, level: string): number {
  if (level === 'complete-beginner') return 75
  if (level === 'some-experience') {
    if (goal === 'strength') return 90
    if (goal === 'fat-loss' || goal === 'endurance') return 45
    return 60
  }
  if (goal === 'strength') return 120
  if (goal === 'muscle-building') return 75
  if (goal === 'toning') return 60
  if (goal === 'fat-loss') return 45
  if (goal === 'endurance') return 30
  return 60
}

function getExerciseCount(targetDuration: number, level: string, goal: string): number {
  const warmup = level === 'complete-beginner' ? 8 : 5
  const available = targetDuration - warmup - 3
  const restSec = getRestSeconds(goal, level)
  const avgSets = level === 'complete-beginner' ? 3 : (goal === 'strength' ? 4 : 3)
  const timePerEx = (avgSets * 1.5) + ((avgSets - 1) * restSec / 60)
  return Math.max(5, Math.min(Math.round(available / timePerEx), 10))
}

function getVolume(level: string, primaryGoal: string, secondaryGoal: string, isCompound: boolean): { sets: number; reps: number } {
  let sets: number
  let reps: number

  if (level === 'complete-beginner') {
    sets = 3
    if (primaryGoal === 'strength') reps = isCompound ? 8 : 10
    else if (primaryGoal === 'muscle-building') reps = isCompound ? 10 : 12
    else if (primaryGoal === 'fat-loss' || primaryGoal === 'toning') reps = 12
    else if (primaryGoal === 'endurance') reps = 15
    else reps = 10
  } else if (level === 'some-experience') {
    sets = isCompound ? 3 : 3
    if (primaryGoal === 'strength') { reps = isCompound ? 6 : 10; if (isCompound) sets = 4 }
    else if (primaryGoal === 'muscle-building') reps = isCompound ? 8 : 10
    else if (primaryGoal === 'fat-loss' || primaryGoal === 'toning') reps = 12
    else if (primaryGoal === 'endurance') { reps = 15; sets = 2 }
    else reps = 10
  } else {
    if (primaryGoal === 'strength') { sets = isCompound ? 4 : 3; reps = isCompound ? 5 : 8 }
    else if (primaryGoal === 'muscle-building') { sets = isCompound ? 4 : 3; reps = isCompound ? 8 : 10 }
    else if (primaryGoal === 'fat-loss' || primaryGoal === 'toning') { sets = 3; reps = 12 }
    else if (primaryGoal === 'endurance') { sets = 2; reps = 20 }
    else { sets = 3; reps = 10 }
  }

  if (secondaryGoal === 'strength' && reps > 8) reps = Math.max(reps - 2, 8)
  if (secondaryGoal === 'muscle-building' && reps < 8) reps = 8
  if (secondaryGoal === 'fat-loss' && reps < 10) reps = 10

  reps = roundToStandardReps(reps)
  return { sets, reps }
}

function scoreExercise(
  ex: ExerciseData, focusAreas: MuscleGroup[], familiarExercises: string[],
  comfort: string, usedIds: string[], cautiousMuscles: MuscleGroup[],
  hasPartner: string, hasBench: boolean, varietyPref: string,
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

  if (hasPartner === 'no' && ex.equipment === 'barbell' && ex.type === 'compound') score -= 2
  if (!hasBench) {
    if (lower.includes('incline') || lower.includes('decline') || lower.includes('chest-supported') || lower.includes('spider') || lower.includes('seal row')) score -= 8
  }
  if (usedIds.includes(ex.id)) score -= 5
  if (cautiousMuscles.includes(ex.primaryMuscle) && ex.type === 'compound') score -= 3
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

function estimateDuration(exercises: GeneratedExercise[], level: string, goal: string, warmup: string): number {
  const restSec = getRestSeconds(goal, level)
  const warmupMins = warmup === 'full' ? 10 : warmup === 'quick' ? 5 : 0
  let total = warmupMins + 3
  exercises.forEach(ex => {
    total += (ex.sets * 1.5) + ((ex.sets - 1) * restSec / 60)
  })
  return Math.round(total)
}

export function generatePlan(answers: OnboardingAnswers, usedExerciseIds: string[] = [], shuffle: boolean = false): GeneratedPlan {
  const split = SPLIT_CONFIG[answers.daysPerWeek] || SPLIT_CONFIG[3]
  const avoidedMuscles = getAvoidedMuscles(answers.injuries, answers.injurySeverity)
  const cautiousMuscles = getCautiousMuscles(answers.injuries, answers.injurySeverity)
  const allowedDifficulties = getAllowedDifficulties(answers.exerciseComplexity)
  const exerciseCount = getExerciseCount(answers.sessionDuration, answers.fitnessLevel, answers.primaryGoal)
  const sortedDays = [...answers.specificDays].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))

  let pool = exerciseDb.filter(ex =>
    (ex.equipment === 'bodyweight' || ex.equipment === 'none' || answers.availableEquipment.includes(ex.equipment)) &&
    !avoidedMuscles.includes(ex.primaryMuscle) &&
    !ex.secondaryMuscles.some(m => avoidedMuscles.includes(m)) &&
    allowedDifficulties.includes(ex.difficulty)
  )
  if (pool.length < 10) {
    pool = exerciseDb.filter(ex =>
      (ex.equipment === 'bodyweight' || ex.equipment === 'none' || answers.availableEquipment.includes(ex.equipment)) &&
      !avoidedMuscles.includes(ex.primaryMuscle) && allowedDifficulties.includes(ex.difficulty)
    )
  }

  const usedThisWeek = new Set<string>()
  const days: GeneratedDay[] = []
  const daysToGenerate = split.days.slice(0, sortedDays.length)
  const cardioCount = answers.cardioPreference === 'heavy' ? 2 : answers.cardioPreference === 'moderate' ? 1 : 0

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
      ex, score: scoreExercise(ex, answers.focusAreas, answers.familiarExercises, answers.comfortWithFreeWeights, usedExerciseIds, cautiousMuscles, answers.hasTrainingPartner, answers.hasAdjustableBench, answers.varietyPreference) + (shuffle ? Math.random() * 8 : 0)
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
        if (canAdd(ex)) {
          selected.push(ex)
          muscleCount[ex.primaryMuscle] = (muscleCount[ex.primaryMuscle] || 0) + 1
        }
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
      return { id: ex.id, name: ex.name, sets, reps, notes }
    })

    exercises = sortExercises(exercises)

    if (cardioCount > 0) {
      const cardioPool = pool.filter(ex => CARDIO_EXERCISES.includes(ex.id) && !selected.some(s => s.id === ex.id))
      cardioPool.slice(0, cardioCount).forEach(ex => {
        exercises.push({ id: ex.id, name: ex.name, sets: 3, reps: 15, notes: 'Cardio finisher — minimal rest between sets.' })
      })
    }

    days.push({
      dayName: WEEKDAY_LABELS[dayOfWeek] || dayOfWeek,
      splitName: splitDay.name,
      exercises,
      targetMuscles,
      estimatedMinutes: estimateDuration(exercises, answers.fitnessLevel, answers.primaryGoal, answers.warmupPreference),
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

  return {
    name: '',
    description: `${split.type} ${goalLabel}${secondaryLabel} program. ${answers.daysPerWeek} days/week, ~${answers.sessionDuration} min sessions.${warmupNote}${answers.cardioPreference !== 'none' ? ' Includes cardio finishers.' : ''}`,
    days,
    splitType: split.type,
  }
}
