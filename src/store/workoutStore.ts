import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  notes?: string
  restSeconds?: number // custom rest time between sets
}

export interface WorkoutPlan {
  id: string
  name: string
  description: string
  exercises: Exercise[]
  isPreMade: boolean
}

interface WorkoutStore {
  plans: WorkoutPlan[]
  selectedPlan: WorkoutPlan | null
  addPlan: (plan: Omit<WorkoutPlan, 'id'>) => void
  updatePlan: (id: string, updates: Partial<WorkoutPlan>) => void
  deletePlan: (id: string) => void
  selectPlan: (id: string) => void
  addExercise: (planId: string, exercise: Omit<Exercise, 'id'>) => void
  updateExercise: (planId: string, exerciseId: string, updates: Partial<Exercise>) => void
  deleteExercise: (planId: string, exerciseId: string) => void
}

// Pre-made workout plans
const DEFAULT_PLANS: WorkoutPlan[] = [
  {
    id: 'beginner-full-body',
    name: 'Beginner Full Body',
    description: 'Simple full body workout — great for getting started. Covers all major muscle groups.',
    isPreMade: true,
    exercises: [
      // Beginner protocol: 60-90s rest (NSCA Foundations of S&C, beginners need slightly more
      // recovery between sets due to slower neural recovery vs trained lifters)
      { id: 'goblet-squat', name: 'Goblet Squat', sets: 3, reps: 12, restSeconds: 75, notes: 'Hold dumbbell at chest, squat to depth' },
      { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', sets: 3, reps: 10, restSeconds: 75, notes: 'Control the weight down, press up strong' },
      { id: 'dumbbell-row', name: 'Dumbbell Row', sets: 3, reps: 10, restSeconds: 75, notes: 'Pull elbow back, squeeze shoulder blade' },
      { id: 'seated-dumbbell-press', name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: 10, restSeconds: 75, notes: 'Press overhead, lower to shoulders' },
      { id: 'dumbbell-bicep-curl', name: 'Dumbbell Bicep Curl', sets: 2, reps: 12, restSeconds: 60, notes: 'Direct arm work — beginners get insufficient bicep volume from rows alone' },
      { id: 'plank', name: 'Plank', sets: 3, reps: 30, restSeconds: 45, notes: 'Hold for 30 seconds per set' },
    ]
  },
  {
    id: 'intermediate-push',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps — classic push workout for intermediate lifters.',
    isPreMade: true,
    exercises: [
      // Compound lifts: 90-120s rest (Schoenfeld 2016 — longer rest = more hypertrophy)
      { id: 'barbell-bench-press', name: 'Barbell Bench Press', sets: 4, reps: 8, restSeconds: 120, notes: 'Main lift — control the descent' },
      { id: 'incline-dumbbell-bench-press', name: 'Incline Dumbbell Bench Press', sets: 3, reps: 10, restSeconds: 90, notes: 'Upper chest focus' },
      { id: 'seated-dumbbell-press', name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: 10, restSeconds: 90, notes: 'Strict form, no leg drive' },
      { id: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 15, restSeconds: 60, notes: 'Light weight, control the movement' },
      { id: 'cable-tricep-pushdown', name: 'Cable Tricep Pushdown', sets: 3, reps: 12, restSeconds: 60, notes: 'Keep elbows pinned to sides' },
    ]
  },
  {
    id: 'intermediate-pull',
    name: 'Pull Day',
    description: 'Back and biceps — build a strong, wide back with heavy rows and pulls.',
    isPreMade: true,
    exercises: [
      // Deadlift: 180s rest (NSCA — heavy compounds at 6 reps need full ATP-PCr recovery)
      { id: 'conventional-deadlift', name: 'Conventional Deadlift', sets: 4, reps: 6, restSeconds: 180, notes: 'Main lift — keep back neutral' },
      { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 3, reps: 10, restSeconds: 90, notes: 'Pull to upper chest, squeeze lats' },
      { id: 'barbell-bent-over-row', name: 'Barbell Bent-Over Row', sets: 3, reps: 8, restSeconds: 120, notes: 'Row to lower chest, control the negative' },
      { id: 'cable-face-pull', name: 'Cable Face Pull', sets: 3, reps: 15, restSeconds: 45, notes: 'External rotate at the end position' },
      { id: 'dumbbell-bicep-curl', name: 'Dumbbell Bicep Curl', sets: 3, reps: 12, restSeconds: 60, notes: 'Supinate wrist as you curl up' },
    ]
  },
  {
    id: 'intermediate-legs',
    name: 'Leg Day',
    description: 'Quads, hamstrings, glutes, and calves — build a solid foundation.',
    isPreMade: true,
    exercises: [
      // Squat 4×8: 120s (intermediate hypertrophy compound rest, Schoenfeld 2016)
      { id: 'barbell-back-squat', name: 'Barbell Back Squat', sets: 4, reps: 8, restSeconds: 120, notes: 'Main lift — hit parallel or below' },
      { id: 'romanian-deadlift', name: 'Romanian Deadlift', sets: 3, reps: 10, restSeconds: 120, notes: 'Feel the stretch in hamstrings' },
      { id: 'leg-press', name: 'Leg Press', sets: 3, reps: 12, restSeconds: 90, notes: 'Full range of motion, don\'t lock knees' },
      { id: 'walking-lunge', name: 'Walking Lunge', sets: 3, reps: 10, restSeconds: 75, notes: '10 steps per leg' },
      { id: 'standing-calf-raise', name: 'Standing Calf Raise', sets: 4, reps: 15, restSeconds: 45, notes: 'Full stretch at bottom, pause at top' },
    ]
  },
]

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      plans: DEFAULT_PLANS,
      selectedPlan: null,
      addPlan: (plan) => set((state) => {
        if (!plan.exercises || plan.exercises.length === 0) {
          return state
        }
        const newPlan = { ...plan, id: Math.random().toString(36).substring(2) }
        return {
          plans: [...state.plans, newPlan],
          selectedPlan: newPlan
        }
      }),
      updatePlan: (id, updates) => set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === id ? { ...plan, ...updates } : plan
        )
      })),
      deletePlan: (id) => set((state) => ({
        plans: state.plans.filter((plan) => plan.id !== id)
      })),
      selectPlan: (id) => set((state) => ({
        selectedPlan: state.plans.find((plan) => plan.id === id) || null
      })),
      addExercise: (planId, exercise) => set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                exercises: [
                  ...plan.exercises,
                  { ...exercise, id: Math.random().toString(36).substring(2) }
                ]
              }
            : plan
        )
      })),
      updateExercise: (planId, exerciseId, updates) => set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                exercises: plan.exercises.map((exercise) =>
                  exercise.id === exerciseId
                    ? { ...exercise, ...updates }
                    : exercise
                )
              }
            : plan
        )
      })),
      deleteExercise: (planId, exerciseId) => set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                exercises: plan.exercises.filter((exercise) => exercise.id !== exerciseId)
              }
            : plan
        )
      })),
    }),
    {
      name: 'workout-plans-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState || !persistedState.plans) return persistedState

        // v0 → v1: fix old Plank entries with reps: 1 → reps: 30
        persistedState.plans = persistedState.plans.map((plan: WorkoutPlan) => ({
          ...plan,
          exercises: plan.exercises.map(ex =>
            ex.name === 'Plank' && ex.reps === 1
              ? { ...ex, reps: 30, notes: 'Hold for 30 seconds per set' }
              : ex
          )
        }))

        // v1 → v2: replace pre-made templates with research-backed restSeconds
        // (preserves user-created plans, only refreshes templates by ID match)
        if (version < 2) {
          const defaultsById = new Map(DEFAULT_PLANS.map(p => [p.id, p]))
          persistedState.plans = persistedState.plans.map((plan: WorkoutPlan) =>
            plan.isPreMade && defaultsById.has(plan.id)
              ? defaultsById.get(plan.id)!
              : plan
          )
        }

        return persistedState
      }
    }
  )
) 