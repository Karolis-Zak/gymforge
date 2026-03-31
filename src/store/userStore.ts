import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserProfile {
  name: string
  age: number
  gender?: 'male' | 'female' | 'other'
  height: number // in cm
  weight: number // in kg
  units: {
    weight: 'kg' | 'lbs'
    height: 'cm' | 'in'
  }
}

interface WeightEntry {
  date: string
  weight: number
}

interface UserStore {
  profile: UserProfile | null
  weightHistory: WeightEntry[]
  theme: 'dark' | 'light'
  defaultRestSeconds: number
  setProfile: (profile: UserProfile) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  calculateBMI: () => number | null
  getIdealWeight: () => number | null
  logWeight: (weight: number) => void
  toggleTheme: () => void
  setDefaultRestSeconds: (seconds: number) => void
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: 0,
  height: 0,
  weight: 0,
  units: {
    weight: 'kg',
    height: 'cm'
  }
}

export type { WeightEntry }

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: null,
      weightHistory: [],
      theme: 'dark' as const,
      defaultRestSeconds: 60,
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) => 
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : { ...DEFAULT_PROFILE, ...updates }
        })),
      calculateBMI: () => {
        const profile = get().profile
        if (!profile || !profile.height || !profile.weight) return null
        const heightInMeters = profile.height / 100
        return Number((profile.weight / (heightInMeters * heightInMeters)).toFixed(1))
      },
      getIdealWeight: () => {
        // Using Devine formula for ideal weight
        const profile = get().profile
        if (!profile || !profile.height) return null
        const heightInCm = profile.height
        
        // Devine formula uses inches, so convert if needed
        const heightInInches = heightInCm / 2.54
        
        if (profile.gender === 'female') {
          return Number(((45.5 + 2.3 * (heightInInches - 60)).toFixed(1)))
        }
        return Number(((50 + 2.3 * (heightInInches - 60)).toFixed(1)))
      },
      logWeight: (weight: number) => {
        if (weight <= 0 || weight > 500) return
        set(state => ({
          weightHistory: [...state.weightHistory, { date: new Date().toISOString(), weight }]
        }))
      },
      toggleTheme: () => {
        set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }))
      },
      setDefaultRestSeconds: (seconds: number) => {
        if (seconds >= 10 && seconds <= 300) set({ defaultRestSeconds: seconds })
      },
    }),
    {
      name: 'user-profile-storage',
    }
  )
) 