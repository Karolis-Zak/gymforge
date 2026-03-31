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
  trainingLocation: 'home' | 'gym' | 'outdoor' | 'mixed'
  availableEquipment: Equipment[]
  hasAdjustableBench: boolean
  hasTrainingPartner: 'yes' | 'sometimes' | 'no'

  // Schedule
  daysPerWeek: number
  specificDays: string[]
  sessionDuration: number
  preferredTime: string
  warmupPreference: 'quick' | 'full' | 'none'

  // Preferences
  varietyPreference: 'variety' | 'routine' | 'balanced'
  focusAreas: MuscleGroup[]
  exerciseComplexity: 'simple' | 'moderate' | 'any'
  muscleFrequency: 'once' | 'twice' | 'auto'

  // Experience
  comfortWithFreeWeights: 'yes' | 'somewhat' | 'not-yet'
  familiarExercises: string[]
}

interface OnboardingStore {
  answers: OnboardingAnswers | null
  completedAt: string | null
  planCreatedAt: string | null
  usedExerciseIds: string[]
  refreshCount: number
  snoozedUntil: string | null

  setAnswers: (answers: OnboardingAnswers) => void
  markPlanCreated: () => void
  addUsedExercises: (ids: string[]) => void
  incrementRefresh: () => void
  snoozeRefresh: () => void
  shouldSuggestRefresh: () => boolean
  reset: () => void
}

export const DEFAULT_ANSWERS: OnboardingAnswers = {
  name: '',
  age: 0,
  gender: '',
  height: 0,
  weight: 0,
  fitnessLevel: 'complete-beginner',
  injuries: [],
  injurySeverity: {},
  primaryGoal: 'general-fitness',
  secondaryGoal: '',
  timelineWeeks: 8,
  cardioPreference: 'none',
  trainingLocation: 'gym',
  availableEquipment: [],
  hasAdjustableBench: false,
  hasTrainingPartner: 'no',
  daysPerWeek: 3,
  specificDays: ['monday', 'wednesday', 'friday'],
  sessionDuration: 45,
  preferredTime: 'no-preference',
  warmupPreference: 'quick',
  varietyPreference: 'balanced',
  focusAreas: [],
  exerciseComplexity: 'simple',
  muscleFrequency: 'auto',
  comfortWithFreeWeights: 'somewhat',
  familiarExercises: [],
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      answers: null,
      completedAt: null,
      planCreatedAt: null,
      usedExerciseIds: [],
      refreshCount: 0,
      snoozedUntil: null,

      setAnswers: (answers) => set({ answers, completedAt: new Date().toISOString() }),
      markPlanCreated: () => set({ planCreatedAt: new Date().toISOString() }),
      addUsedExercises: (ids) => set(state => ({
        usedExerciseIds: [...new Set([...state.usedExerciseIds, ...ids])]
      })),
      incrementRefresh: () => set(state => ({
        refreshCount: state.refreshCount + 1,
        planCreatedAt: new Date().toISOString(),
        snoozedUntil: null,
      })),
      snoozeRefresh: () => set({
        snoozedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }),
      shouldSuggestRefresh: () => {
        const state = get()
        if (!state.planCreatedAt || !state.answers) return false
        if (state.snoozedUntil && new Date(state.snoozedUntil) > new Date()) return false
        const daysSince = (Date.now() - new Date(state.planCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
        const interval = state.answers.varietyPreference === 'variety' ? 14 : state.answers.varietyPreference === 'balanced' ? 21 : 28
        return daysSince >= interval
      },
      reset: () => set({
        answers: null, completedAt: null, planCreatedAt: null,
        usedExerciseIds: [], refreshCount: 0, snoozedUntil: null,
      }),
    }),
    { name: 'onboarding-storage' }
  )
)
