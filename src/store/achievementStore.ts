import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Achievement {
  id: string
  title: string
  description: string
  category: 'consistency' | 'performance' | 'skill' | 'milestone'
  icon: string
  unlockedAt?: string
}

interface AchievementStore {
  achievements: Record<string, Achievement>
  unlockedAchievementIds: Set<string>
  unlockAchievement: (id: string) => void
  isUnlocked: (id: string) => boolean
  getUnlocked: () => Achievement[]
  getLocked: () => Achievement[]
}

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // Consistency
  {
    id: 'first-workout',
    title: 'Getting Started',
    description: 'Complete your first workout',
    category: 'consistency',
    icon: '🏋️',
  },
  {
    id: 'week-streak-3',
    title: '3-Day Streak',
    description: 'Work out 3 days in a row',
    category: 'consistency',
    icon: '🔥',
  },
  {
    id: 'week-streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'consistency',
    icon: '⚡',
  },
  {
    id: 'week-streak-30',
    title: 'Iron Commitment',
    description: 'Maintain a 30-day streak',
    category: 'consistency',
    icon: '💪',
  },
  {
    id: 'workouts-10',
    title: 'Decade Member',
    description: 'Complete 10 workouts',
    category: 'consistency',
    icon: '📊',
  },
  {
    id: 'workouts-50',
    title: 'Legend in Progress',
    description: 'Complete 50 workouts',
    category: 'consistency',
    icon: '👑',
  },
  {
    id: 'workouts-100',
    title: 'Century Champion',
    description: 'Complete 100 workouts',
    category: 'consistency',
    icon: '🏆',
  },
  
  // Performance
  {
    id: 'volume-1000',
    title: 'Ton of Work',
    description: 'Hit 1000kg volume in a single workout',
    category: 'performance',
    icon: '📈',
  },
  {
    id: 'volume-5000',
    title: 'Heavy Lifter',
    description: 'Accumulate 5000kg total volume',
    category: 'performance',
    icon: '🚀',
  },
  {
    id: 'all-rpe-logged',
    title: 'RPE Master',
    description: 'Log RPE for all exercises in a workout',
    category: 'performance',
    icon: '🎯',
  },
  {
    id: 'all-sets-completed',
    title: 'Perfect Session',
    description: 'Complete all sets in a workout with zero skips',
    category: 'performance',
    icon: '✨',
  },
  
  // Skill
  {
    id: 'exercises-10',
    title: 'Versatile Athlete',
    description: 'Complete 10 different exercises',
    category: 'skill',
    icon: '🎓',
  },
  {
    id: 'exercises-25',
    title: 'Exercise Expert',
    description: 'Complete 25 different exercises',
    category: 'skill',
    icon: '🧠',
  },
  {
    id: 'compound-focus',
    title: 'Compound Master',
    description: 'Log 5+ compound exercises in one week',
    category: 'skill',
    icon: '⚙️',
  },
  {
    id: 'custom-plan',
    title: 'Architect',
    description: 'Create a custom workout plan',
    category: 'skill',
    icon: '🏗️',
  },

  // Milestone
  {
    id: 'profile-complete',
    title: 'Identity Established',
    description: 'Complete your full user profile',
    category: 'milestone',
    icon: '👤',
  },
  {
    id: 'plan-created',
    title: 'Plan Maker',
    description: 'Create your first workout plan',
    category: 'milestone',
    icon: '📋',
  },
  {
    id: 'weight-logged',
    title: 'Track Master',
    description: 'Log your body weight',
    category: 'milestone',
    icon: '⚖️',
  },
]

const achievementMap = new Map(ACHIEVEMENT_DEFINITIONS.map(a => [a.id, a]))

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      achievements: Object.fromEntries(
        ACHIEVEMENT_DEFINITIONS.map(a => [a.id, a])
      ),
      unlockedAchievementIds: new Set<string>(),
      unlockAchievement: (id: string) => {
        const state = get()
        if (state.unlockedAchievementIds.has(id)) return
        
        set(prev => ({
          unlockedAchievementIds: new Set([...prev.unlockedAchievementIds, id]),
          achievements: {
            ...prev.achievements,
            [id]: {
              ...prev.achievements[id],
              unlockedAt: new Date().toISOString(),
            }
          }
        }))
      },
      isUnlocked: (id: string) => get().unlockedAchievementIds.has(id),
      getUnlocked: () => {
        const { achievements, unlockedAchievementIds } = get()
        return Array.from(unlockedAchievementIds)
          .map(id => achievements[id])
          .filter(Boolean)
          .sort((a, b) => {
            const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0
            const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0
            return dateB - dateA
          })
      },
      getLocked: () => {
        const { achievements, unlockedAchievementIds } = get()
        return ACHIEVEMENT_DEFINITIONS
          .filter(a => !unlockedAchievementIds.has(a.id))
          .map(a => achievements[a.id] || a)
      }
    }),
    {
      name: 'achievement-store',
      partialize: (state) => ({
        unlockedAchievementIds: Array.from(state.unlockedAchievementIds),
        achievements: state.achievements,
      }),
      merge: (persistedState: any, currentState) => {
        // Guard against corrupted/legacy localStorage: a non-array value would
        // make `new Set(...)` throw, and a null persistedState would throw on access.
        const persisted = persistedState && typeof persistedState === 'object' ? persistedState : {}
        const ids = Array.isArray(persisted.unlockedAchievementIds) ? persisted.unlockedAchievementIds : []
        return {
          ...currentState,
          unlockedAchievementIds: new Set(ids),
          achievements: persisted.achievements && typeof persisted.achievements === 'object'
            ? persisted.achievements
            : currentState.achievements,
        }
      },
    }
  )
)
