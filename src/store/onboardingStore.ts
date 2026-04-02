import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MuscleGroup, Equipment } from '../data/exercises'

export interface OnboardingAnswers {
  // About You
  name: string
  age: number
  gender: 'male' | 'female' | 'other' | ''
  height: number
  weight: number
  bodyType: 'lean' | 'athletic' | 'stocky' | 'overweight' | 'obese' | ''  // Note: All 5 body types now visible in UI

  // Fitness Level
  fitnessLevel: 'complete-beginner' | 'some-experience' | 'regular-exerciser'
  injuries: string[]
  injurySeverity: Record<string, 'acute' | 'chronic'>

  // Goals
  primaryGoal: 'strength' | 'muscle-building' | 'toning' | 'fat-loss' | 'general-fitness' | 'endurance' | 'flexibility'
  secondaryGoal: string
  timelineWeeks: number
  cardioPreference: 'none' | 'light' | 'moderate' | 'heavy'

  // Equipment & Location
  availableEquipment: Equipment[]
  trainingLocation: 'gym' | 'home' | undefined
  hasAdjustableBench: boolean | null
  hasTrainingPartner: 'yes' | 'sometimes' | 'no'

  // Schedule
  daysPerWeek: number
  specificDays: string[]
  sessionDuration: number
  warmupPreference: 'quick' | 'full' | 'none'

  // Preferences
  varietyPreference: 'variety' | 'routine' | 'balanced'
  focusAreas: MuscleGroup[]
  exerciseComplexity: 'simple' | 'moderate' | 'any'

  // Experience
  comfortWithFreeWeights: 'yes' | 'somewhat' | 'not-yet'
  typicalDumbbellWeight: number | null  // in kg, or null if unknown
  familiarExercises: string[]
}

interface OnboardingStore {
  answers: OnboardingAnswers | null
  completedAt: string | null
  planCreatedAt: string | null
  usedExerciseIds: string[]

  setAnswers: (answers: OnboardingAnswers) => void
  markPlanCreated: () => void
  addUsedExercises: (ids: string[]) => void
  reset: () => void
}

export const DEFAULT_ANSWERS: OnboardingAnswers = {
  name: '',
  age: 0,
  gender: '',
  height: 0,
  weight: 0,
  bodyType: '',
  fitnessLevel: 'complete-beginner',
  injuries: [],
  injurySeverity: {},
  primaryGoal: 'general-fitness',
  secondaryGoal: '',
  timelineWeeks: 8,
  cardioPreference: 'none',
  availableEquipment: [],
  trainingLocation: undefined,
  hasAdjustableBench: null,
  hasTrainingPartner: 'no',
  daysPerWeek: 3,
  specificDays: ['monday', 'wednesday', 'friday'],
  sessionDuration: 45,
  warmupPreference: 'quick',
  varietyPreference: 'balanced',
  focusAreas: [],
  exerciseComplexity: 'simple',
  comfortWithFreeWeights: 'somewhat',
  typicalDumbbellWeight: null,
  familiarExercises: [],
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      answers: null,
      completedAt: null,
      planCreatedAt: null,
      usedExerciseIds: [],

      setAnswers: (answers) => set({ answers, completedAt: new Date().toISOString() }),
      markPlanCreated: () => set({ planCreatedAt: new Date().toISOString() }),
      addUsedExercises: (ids) => set(state => ({
        usedExerciseIds: [...new Set([...state.usedExerciseIds, ...ids])]
      })),
      reset: () => set({
        answers: null,
        completedAt: null,
        planCreatedAt: null,
        usedExerciseIds: [],
      }),
    }),
    { name: 'onboarding-storage' }
  )
)
