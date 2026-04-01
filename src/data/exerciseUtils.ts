import { exercises, type ExerciseData, type MuscleGroup, type Equipment, type Difficulty } from './exercises'

interface ExerciseFilters {
  muscle?: MuscleGroup
  equipment?: Equipment
  difficulty?: Difficulty
  type?: 'compound' | 'isolation'
}

export function searchExercises(query: string, filters?: ExerciseFilters): ExerciseData[] {
  let results = exercises

  if (query) {
    const q = query.toLowerCase()
    results = results.filter(ex =>
      ex.name.toLowerCase().includes(q) ||
      ex.primaryMuscle.includes(q) ||
      ex.equipment.includes(q)
    )
  }

  if (filters?.muscle) {
    results = results.filter(ex => ex.primaryMuscle === filters.muscle)
  }

  if (filters?.equipment) {
    results = results.filter(ex => ex.equipment === filters.equipment)
  }

  if (filters?.difficulty) {
    results = results.filter(ex => ex.difficulty === filters.difficulty)
  }

  if (filters?.type) {
    results = results.filter(ex => ex.type === filters.type)
  }

  return results
}

export function getExercisesByMuscle(muscle: MuscleGroup): ExerciseData[] {
  return exercises.filter(ex => ex.primaryMuscle === muscle)
}

export function getExercisesByEquipment(equipment: Equipment): ExerciseData[] {
  return exercises.filter(ex => ex.equipment === equipment)
}

export function getExerciseById(id: string): ExerciseData | undefined {
  return exercises.find(ex => ex.id === id)
}

export function getAllMuscleGroups(): MuscleGroup[] {
  return ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'traps', 'forearms']
}

export function getAllEquipment(): Equipment[] {
  return ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'band', 'kettlebell', 'none', 'ez-bar', 'smith-machine', 'pull-up-bar']
}

export function getMuscleGroupLabel(muscle: MuscleGroup): string {
  const labels: Record<MuscleGroup, string> = {
    chest: 'Chest',
    back: 'Back',
    shoulders: 'Shoulders',
    biceps: 'Biceps',
    triceps: 'Triceps',
    quads: 'Quads',
    hamstrings: 'Hamstrings',
    glutes: 'Glutes',
    calves: 'Calves',
    core: 'Core',
    traps: 'Traps',
    forearms: 'Forearms',
  }
  return labels[muscle]
}

export function getEquipmentLabel(equipment: Equipment): string {
  const labels: Record<Equipment, string> = {
    barbell: 'Barbell',
    'trap-bar': 'Trap Bar',
    dumbbell: 'Dumbbell',
    cable: 'Cable',
    machine: 'Machine',
    bodyweight: 'Bodyweight',
    band: 'Resistance Band',
    kettlebell: 'Kettlebell',
    none: 'No Equipment',
    'ez-bar': 'EZ Bar',
    'smith-machine': 'Smith Machine',
    'pull-up-bar': 'Pull-up Bar',
  }
  return labels[equipment]
}
