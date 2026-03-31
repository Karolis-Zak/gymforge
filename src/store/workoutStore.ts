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
    name: 'Beginner Full Body Workout',
    description: 'A simple full body workout perfect for beginners',
    isPreMade: true,
    exercises: [
      {
        id: 'push-up',
        name: 'Push-Up',
        sets: 3,
        reps: 10,
        notes: 'Keep your core tight and back straight'
      },
      {
        id: 'barbell-back-squat',
        name: 'Barbell Back Squat',
        sets: 3,
        reps: 12,
        notes: 'Keep your knees aligned with your toes'
      },
      {
        id: 'plank',
        name: 'Plank',
        sets: 3,
        reps: 1,
        notes: 'Hold for 30 seconds'
      }
    ]
  },
  {
    id: 'intermediate-strength',
    name: 'Intermediate Strength Training',
    description: 'A progressive strength training program',
    isPreMade: true,
    exercises: [
      {
        id: 'conventional-deadlift',
        name: 'Conventional Deadlift',
        sets: 4,
        reps: 8,
        notes: 'Focus on proper form and back position'
      },
      {
        id: 'barbell-bench-press',
        name: 'Barbell Bench Press',
        sets: 4,
        reps: 10,
        notes: 'Keep shoulders back and feet planted'
      }
    ]
  }
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
    }
  )
) 