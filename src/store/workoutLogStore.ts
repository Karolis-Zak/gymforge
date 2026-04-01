import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useWorkoutStore } from './workoutStore'

export interface WorkoutSet {
  weight?: number // in kg
  reps: number
  completed: boolean
}

export interface ExerciseLog {
  id: string
  exerciseId: string
  exerciseName: string
  sets: WorkoutSet[]
  notes?: string
  rpe?: number // Rate of Perceived Exertion (1-10 scale)
  date: string // ISO string
}

export interface WorkoutLog {
  id: string
  planId: string
  planName: string
  date: string // ISO string
  exercises: ExerciseLog[]
  completed: boolean
  sessionNotes?: string
  durationSeconds?: number
}

interface WorkoutLogStore {
  logs: WorkoutLog[]
  currentWorkout: WorkoutLog | null
  startWorkout: (planId: string, planName: string) => void
  logExercise: (exerciseLog: Omit<ExerciseLog, 'id'>) => void
  completeSet: (exerciseId: string, setIndex: number, completed: boolean) => void
  updateSetWeight: (exerciseId: string, setIndex: number, weight: number) => void
  updateSetReps: (exerciseId: string, setIndex: number, reps: number) => void
  updateExerciseRPE: (exerciseId: string, rpe: number | undefined) => void
  completeWorkout: (durationSeconds?: number) => void
  cancelWorkout: () => void
  updateSessionNotes: (notes: string) => void
  swapExercise: (exerciseId: string, newExerciseId: string, newExerciseName: string) => void
  getWorkoutStats: () => {
    totalWorkouts: number
    completedWorkouts: number
    currentStreak: number
    longestStreak: number
  }
  getExerciseProgress: (exerciseId: string) => {
    dates: string[]
    weights: (number | null)[]
    totalReps: number[]
  }
}

export const useWorkoutLogStore = create<WorkoutLogStore>()(
  persist(
    (set, get) => ({
      logs: [],
      currentWorkout: null,

      startWorkout: (planId, planName) => {
        const plans = useWorkoutStore.getState().plans
        const plan = plans.find(p => p.id === planId)
        if (!plan || !Array.isArray(plan.exercises) || plan.exercises.length === 0 || plan.exercises.some(ex => !ex.sets || ex.sets === 0)) {
          return
        }

        // Find last completed workout weights for each exercise
        const logs = get().logs
        const getLastWeights = (exerciseId: string): WorkoutSet[] => {
          for (let i = logs.length - 1; i >= 0; i--) {
            if (!logs[i].completed) continue
            const ex = logs[i].exercises.find(e => e.exerciseId === exerciseId)
            if (ex && ex.sets.length > 0) return ex.sets
          }
          return []
        }

        const workout: WorkoutLog = {
          id: Math.random().toString(36).substring(2),
          planId,
          planName,
          date: new Date().toISOString(),
          exercises: plan.exercises.map(ex => {
            const lastSets = getLastWeights(ex.id)
            const numSets = typeof ex.sets === 'number' ? ex.sets : 0
            return {
              id: Math.random().toString(36).substring(2),
              exerciseId: ex.id,
              exerciseName: ex.name,
              sets: Array(numSets).fill(null).map((_, i) => ({
                weight: lastSets[i]?.weight || 0,
                reps: lastSets[i]?.reps || ex.reps || 0,
                completed: false,
              })),
              notes: ex.notes || '',
              date: new Date().toISOString()
            }
          }),
          completed: false
        }
        set({ currentWorkout: workout })
      },

      logExercise: (exerciseLog) => {
        set((state) => {
          if (!state.currentWorkout) return state
          
          const exercise: ExerciseLog = {
            ...exerciseLog,
            id: Math.random().toString(36).substring(2)
          }
          
          return {
            currentWorkout: {
              ...state.currentWorkout,
              exercises: [...state.currentWorkout.exercises, exercise]
            }
          }
        })
      },

      completeSet: (exerciseId, setIndex, completed) => {
        set((state) => {
          if (!state.currentWorkout) return state
          
          const updatedExercises = state.currentWorkout.exercises.map((exercise) => {
            if (exercise.id === exerciseId) {
              const updatedSets = [...exercise.sets]
              updatedSets[setIndex] = { ...updatedSets[setIndex], completed }
              return { ...exercise, sets: updatedSets }
            }
            return exercise
          })
          
          return {
            currentWorkout: {
              ...state.currentWorkout,
              exercises: updatedExercises
            }
          }
        })
      },

      updateSetWeight: (exerciseId, setIndex, weight) => {
        set((state) => {
          if (!state.currentWorkout) return state
          
          const updatedExercises = state.currentWorkout.exercises.map((exercise) => {
            if (exercise.id === exerciseId) {
              const updatedSets = [...exercise.sets]
              updatedSets[setIndex] = { ...updatedSets[setIndex], weight }
              return { ...exercise, sets: updatedSets }
            }
            return exercise
          })
          
          return {
            currentWorkout: {
              ...state.currentWorkout,
              exercises: updatedExercises
            }
          }
        })
      },

      updateSetReps: (exerciseId, setIndex, reps) => {
        set((state) => {
          if (!state.currentWorkout) return state

          const updatedExercises = state.currentWorkout.exercises.map((exercise) => {
            if (exercise.id === exerciseId) {
              const updatedSets = [...exercise.sets]
              updatedSets[setIndex] = { ...updatedSets[setIndex], reps }
              return { ...exercise, sets: updatedSets }
            }
            return exercise
          })

          return {
            currentWorkout: {
              ...state.currentWorkout,
              exercises: updatedExercises
            }
          }
        })
      },

      updateExerciseRPE: (exerciseId, rpe) => {
        set((state) => {
          if (!state.currentWorkout) return state

          const updatedExercises = state.currentWorkout.exercises.map((exercise) => {
            if (exercise.id === exerciseId) {
              return { ...exercise, rpe }
            }
            return exercise
          })

          return {
            currentWorkout: {
              ...state.currentWorkout,
              exercises: updatedExercises
            }
          }
        })
      },

      completeWorkout: (durationSeconds?: number) => {
        set((state) => {
          if (!state.currentWorkout) return state
          return {
            logs: [...state.logs, { ...state.currentWorkout, completed: true, durationSeconds }],
            currentWorkout: null
          }
        })
      },

      cancelWorkout: () => {
        set({ currentWorkout: null })
      },

      updateSessionNotes: (notes: string) => {
        set((state) => {
          if (!state.currentWorkout) return state
          return { currentWorkout: { ...state.currentWorkout, sessionNotes: notes } }
        })
      },

      swapExercise: (exerciseId: string, newExerciseId: string, newExerciseName: string) => {
        set((state) => {
          if (!state.currentWorkout) return state
          return {
            currentWorkout: {
              ...state.currentWorkout,
              exercises: state.currentWorkout.exercises.map(ex =>
                ex.id === exerciseId
                  ? { ...ex, exerciseId: newExerciseId, exerciseName: newExerciseName, sets: ex.sets.map(s => ({ ...s, completed: false })) }
                  : ex
              )
            }
          }
        })
      },

      getWorkoutStats: () => {
        const state = get()
        const logs = state.logs
        
        // Calculate total and completed workouts
        const totalWorkouts = logs.length
        const completedWorkouts = logs.filter(log => log.completed).length
        
        // Calculate streaks
        const dates = logs
          .filter(log => log.completed)
          .map(log => new Date(log.date).toISOString().split('T')[0])
          .sort()
        
        let currentStreak = 0
        let longestStreak = 0
        let tempStreak = 0
        
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        
        // Calculate streaks
        for (let i = 0; i < dates.length; i++) {
          if (i === 0) {
            tempStreak = 1
          } else {
            const prevDate = new Date(dates[i - 1])
            const currDate = new Date(dates[i])
            const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / 86400000)
            
            if (diffDays === 1) {
              tempStreak++
            } else {
              if (tempStreak > longestStreak) {
                longestStreak = tempStreak
              }
              tempStreak = 1
            }
          }
        }
        
        // Update longest streak if needed
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
        }
        
        // Check if the streak is current
        if (dates.includes(today) || dates.includes(yesterday)) {
          currentStreak = tempStreak
        } else {
          currentStreak = 0
        }
        
        return {
          totalWorkouts,
          completedWorkouts,
          currentStreak,
          longestStreak
        }
      },

      getExerciseProgress: (exerciseId) => {
        const state = get()
        const logs = state.logs
        
        const exerciseLogs = logs
          .filter(log => log.completed)
          .flatMap(log => 
            log.exercises.filter(ex => ex.exerciseId === exerciseId)
          )
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        return {
          dates: exerciseLogs.map(log => log.date),
          weights: exerciseLogs.map(log => {
            const maxWeight = Math.max(...log.sets.map(set => set.weight || 0))
            return maxWeight > 0 ? maxWeight : null
          }),
          totalReps: exerciseLogs.map(log => 
            log.sets.reduce((total, set) => total + (set.completed ? set.reps : 0), 0)
          )
        }
      }
    }),
    {
      name: 'workout-logs-storage'
    }
  )
) 