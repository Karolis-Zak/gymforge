import { exercises as exerciseDb, type ExerciseData, type MuscleGroup, type Difficulty } from '../data/exercises'
import { getMuscleGroupLabel } from '../data/exerciseUtils'
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

function getAvoidedMuscles(injuries: string[], severity: Record<string, string>): MuscleGroup[] {
  const avoided = new Set<MuscleGroup>()
  injuries.forEach(injury => {
    // Acute injuries: avoid completely. Chronic: still include (algorithm will prefer lighter exercises)
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

function getExerciseCount(duration: number, level: string): number {
  const warmup = level === 'complete-beginner' ? 5 : 0 // beginners need more warmup time
  const effectiveMins = duration - 10 - warmup // subtract warmup/cooldown
  if (effectiveMins <= 20) return level === 'complete-beginner' ? 4 : 5
  if (effectiveMins <= 35) return level === 'complete-beginner' ? 5 : 6
  if (effectiveMins <= 50) return level === 'regular-exerciser' ? 7 : 6
  return level === 'complete-beginner' ? 6 : 8
}

function getVolume(level: string, goal: string, isCompound: boolean): { sets: number; reps: number } {
  let sets = 3
  let reps = 10

  if (level === 'complete-beginner') {
    sets = 3
    reps = isCompound ? 10 : 12
  } else if (level === 'some-experience') {
    sets = isCompound ? 4 : 3
    reps = isCompound ? 8 : 10
  } else {
    sets = isCompound ? 4 : 3
    reps = isCompound ? 6 : 10
  }

  // Goal modifiers
  if (goal === 'strength') { reps = Math.max(reps - 2, 5); sets = Math.min(sets + 1, 5) }
  if (goal === 'fat-loss') { reps = Math.min(reps + 3, 15) }
  if (goal === 'toning') { reps = Math.min(reps + 2, 15); sets = 3 }
  if (goal === 'endurance') { reps = Math.min(reps + 5, 20); sets = Math.max(sets - 1, 2) }
  if (goal === 'muscle-building') { reps = Math.min(Math.max(reps, 8), 12) }

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
): number {
  let score = 0

  // Focus area bonus
  if (focusAreas.includes(ex.primaryMuscle)) score += 10

  // Compound preference
  if (ex.type === 'compound') score += 5

  // Familiar exercise bonus
  const lower = ex.name.toLowerCase()
  if (familiarExercises.some(f => lower.includes(f.toLowerCase()))) score += 4

  // Equipment comfort
  if (comfort === 'not-yet') {
    if (ex.equipment === 'barbell' || ex.equipment === 'ez-bar') score -= 6
    if (ex.equipment === 'machine' || ex.equipment === 'cable') score += 3
    if (ex.equipment === 'bodyweight') score += 2
  } else if (comfort === 'somewhat') {
    if (ex.equipment === 'barbell') score -= 2
  }

  // No spotter: deprioritize heavy barbell compounds
  if (hasPartner === 'no' && ex.equipment === 'barbell' && ex.type === 'compound') score -= 2

  // No adjustable bench: deprioritize incline/decline exercises
  if (!hasBench) {
    const lower = ex.name.toLowerCase()
    if (lower.includes('incline') || lower.includes('decline') || lower.includes('chest-supported') || lower.includes('spider') || lower.includes('seal row')) score -= 8
  }

  // Previously used penalty
  if (usedIds.includes(ex.id)) score -= 5

  // Chronic injury caution: prefer isolation over compound for cautious muscles
  if (cautiousMuscles.includes(ex.primaryMuscle) && ex.type === 'compound') score -= 3

  // Small random for variety
  score += Math.random() * 2

  return score
}

function estimateDuration(exercises: GeneratedExercise[], level: string, warmup: string): number {
  const restSeconds = level === 'complete-beginner' ? 90 : level === 'some-experience' ? 60 : 45
  const warmupMins = warmup === 'full' ? 10 : warmup === 'quick' ? 5 : 0
  let total = warmupMins + 5 // + cooldown
  exercises.forEach(ex => {
    total += (ex.sets * 2) + ((ex.sets - 1) * restSeconds / 60)
  })
  return Math.round(total)
}

export function generatePlan(answers: OnboardingAnswers, usedExerciseIds: string[] = []): GeneratedPlan {
  const split = SPLIT_CONFIG[answers.daysPerWeek] || SPLIT_CONFIG[3]
  const avoidedMuscles = getAvoidedMuscles(answers.injuries, answers.injurySeverity)
  const cautiousMuscles = getCautiousMuscles(answers.injuries, answers.injurySeverity)
  const allowedDifficulties = getAllowedDifficulties(answers.exerciseComplexity)
  const exerciseCount = getExerciseCount(answers.sessionDuration, answers.fitnessLevel)

  const sortedDays = [...answers.specificDays].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))

  // Filter exercise pool - ALWAYS include bodyweight and none equipment
  let pool = exerciseDb.filter(ex =>
    (ex.equipment === 'bodyweight' || ex.equipment === 'none' || answers.availableEquipment.includes(ex.equipment)) &&
    !avoidedMuscles.includes(ex.primaryMuscle) &&
    !ex.secondaryMuscles.some(m => avoidedMuscles.includes(m)) &&
    allowedDifficulties.includes(ex.difficulty)
  )

  // If pool is too small due to heavy injury filtering, relax secondary muscle check
  if (pool.length < 10) {
    pool = exerciseDb.filter(ex =>
      (ex.equipment === 'bodyweight' || ex.equipment === 'none' || answers.availableEquipment.includes(ex.equipment)) &&
      !avoidedMuscles.includes(ex.primaryMuscle) &&
      allowedDifficulties.includes(ex.difficulty)
    )
  }

  const usedThisWeek = new Set<string>()
  const days: GeneratedDay[] = []

  // Only generate as many days as the user actually selected
  const daysToGenerate = split.days.slice(0, sortedDays.length)

  daysToGenerate.forEach((splitDay, i) => {
    const dayOfWeek = sortedDays[i]
    const targetMuscles = splitDay.muscles.filter(m => !avoidedMuscles.includes(m))

    // Get exercises for this day's target muscles
    const dayPool = pool.filter(ex =>
      targetMuscles.includes(ex.primaryMuscle) &&
      !usedThisWeek.has(ex.id)
    )

    // Score and sort
    const scored = dayPool.map(ex => ({
      ex,
      score: scoreExercise(ex, answers.focusAreas, answers.familiarExercises, answers.comfortWithFreeWeights, usedExerciseIds, cautiousMuscles, answers.hasTrainingPartner, answers.hasAdjustableBench)
    })).sort((a, b) => b.score - a.score)

    const compounds = scored.filter(s => s.ex.type === 'compound')
    const isolations = scored.filter(s => s.ex.type === 'isolation')

    const selected: ExerciseData[] = []
    const coveredMuscles = new Set<MuscleGroup>()

    // 1. One compound per major target muscle
    const compoundSlots = Math.min(Math.ceil(exerciseCount / 2), compounds.length)
    for (const { ex } of compounds) {
      if (selected.length >= compoundSlots) break
      if (!coveredMuscles.has(ex.primaryMuscle) || answers.focusAreas.includes(ex.primaryMuscle)) {
        selected.push(ex)
        coveredMuscles.add(ex.primaryMuscle)
      }
    }

    // 2. Fill with isolations
    for (const { ex } of isolations) {
      if (selected.length >= exerciseCount) break
      if (!selected.some(s => s.id === ex.id)) {
        selected.push(ex)
      }
    }

    // 3. If still not enough, add more compounds
    for (const { ex } of compounds) {
      if (selected.length >= exerciseCount) break
      if (!selected.some(s => s.id === ex.id)) {
        selected.push(ex)
      }
    }

    // 4. Fallback: allow secondary muscle matches
    if (selected.length < 3) {
      const fallback = pool.filter(ex =>
        !usedThisWeek.has(ex.id) &&
        !selected.some(s => s.id === ex.id) &&
        ex.secondaryMuscles.some(m => targetMuscles.includes(m))
      ).slice(0, exerciseCount - selected.length)
      selected.push(...fallback)
    }

    // 5. Last resort: allow any exercise from pool not yet used this week
    if (selected.length < 2) {
      const lastResort = pool.filter(ex =>
        !usedThisWeek.has(ex.id) && !selected.some(s => s.id === ex.id)
      ).slice(0, Math.max(3, exerciseCount) - selected.length)
      selected.push(...lastResort)
    }

    selected.forEach(ex => usedThisWeek.add(ex.id))

    const exercises: GeneratedExercise[] = selected.map(ex => {
      const vol = getVolume(answers.fitnessLevel, answers.primaryGoal, ex.type === 'compound')
      let notes = ex.tips[0] || ''
      if (answers.fitnessLevel === 'complete-beginner' && ex.type === 'compound') {
        notes = 'Focus on form over weight. ' + notes
      }
      if (answers.primaryGoal === 'fat-loss') {
        notes = (notes ? notes + ' ' : '') + 'Keep rest 30-60s.'
      }
      return { id: ex.id, name: ex.name, sets: vol.sets, reps: vol.reps, notes }
    })

    days.push({
      dayName: WEEKDAY_LABELS[dayOfWeek] || dayOfWeek,
      splitName: splitDay.name,
      exercises,
      targetMuscles,
      estimatedMinutes: estimateDuration(exercises, answers.fitnessLevel, answers.warmupPreference),
    })
  })

  const goalLabels: Record<string, string> = {
    'strength': 'Strength', 'muscle-building': 'Muscle Building', 'toning': 'Body Toning', 'fat-loss': 'Fat Loss',
    'general-fitness': 'General Fitness', 'endurance': 'Endurance', 'flexibility': 'Flexibility',
  }

  return {
    name: '',
    description: `${split.type} program for ${goalLabels[answers.primaryGoal] || 'fitness'}${answers.secondaryGoal ? ` + ${goalLabels[answers.secondaryGoal] || answers.secondaryGoal}` : ''}. ${answers.daysPerWeek} days/week, ~${answers.sessionDuration} min sessions.${answers.cardioPreference !== 'none' ? ` Add ${answers.cardioPreference} cardio on rest days.` : ''}`,
    days,
    splitType: split.type,
  }
}
