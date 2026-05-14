import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecoveryLog {
  date: string // ISO string
  quality: 'poor' | 'fair' | 'good' | 'excellent' // how well recovered
  sleep?: number // hours slept
  soreness: number // 1-5 scale (1=none, 5=extreme)
  fatigue?: number // 1-5 scale (1=fresh, 5=exhausted) — optional, defaults to 3 if not provided
  notes?: string
}

interface RecoveryStore {
  logs: RecoveryLog[]
  logRecovery: (recovery: Omit<RecoveryLog, 'date'>) => void
  getRecoveryLog: (date: string) => RecoveryLog | undefined
  getWeeklyRecoveryScore: () => number
  getRecentLogs: (days: number) => RecoveryLog[]
  deleteRecoveryLog: (date: string) => void
  updateRecoveryLog: (date: string, updates: Partial<Omit<RecoveryLog, 'date'>>) => void
}

const qualityScores: Record<string, number> = {
  poor: 1,
  fair: 2,
  good: 3,
  excellent: 4,
}

export const useRecoveryStore = create<RecoveryStore>()(
  persist(
    (set, get) => ({
      logs: [],
      logRecovery: (recovery) => {
        const today = new Date().toISOString().split('T')[0]
        set((state) => {
          const existing = state.logs.findIndex(l => l.date === today)
          if (existing >= 0) {
            const newLogs = [...state.logs]
            newLogs[existing] = { ...newLogs[existing], ...recovery, date: today }
            return { logs: newLogs }
          }
          return { logs: [...state.logs, { ...recovery, date: today }] }
        })
      },
      getRecoveryLog: (date: string) => {
        return get().logs.find(l => l.date === date)
      },
      getWeeklyRecoveryScore: () => {
        const logs = get().getRecentLogs(7)
        if (logs.length === 0) return 0

        const avgQuality = logs.reduce((sum, l) => sum + qualityScores[l.quality], 0) / logs.length
        const avgSleep = logs.reduce((sum, l) => sum + (l.sleep || 7), 0) / logs.length
        // Soreness/fatigue rated 1-5 (1 = best). Map [1,5] → [1,0]:
        //   (avg - 1) / 4 then invert → score component in [0,1]
        // Previous formula `1 - avg/5` capped at 0.8 even with perfect 1-rating, never reaching 100%.
        const avgSorenessRaw = logs.reduce((sum, l) => sum + l.soreness, 0) / logs.length
        const avgFatigueRaw  = logs.reduce((sum, l) => sum + (l.fatigue || 3), 0) / logs.length
        const sorenessScore = 1 - (avgSorenessRaw - 1) / 4
        const fatigueScore  = 1 - (avgFatigueRaw  - 1) / 4

        // Weighted score: quality 40%, sleep 20%, soreness 20%, fatigue 20%
        const score = (avgQuality / 4) * 0.4 +
                     Math.min(avgSleep, 9) / 9 * 0.2 +
                     sorenessScore * 0.2 +
                     fatigueScore * 0.2

        return Math.round(score * 100)
      },
      getRecentLogs: (days: number) => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        cutoff.setHours(0, 0, 0, 0)

        return get().logs
          .filter(l => new Date(l.date) >= cutoff)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      },
      deleteRecoveryLog: (date: string) => {
        set((state) => ({
          logs: state.logs.filter(l => l.date !== date)
        }))
      },
      updateRecoveryLog: (date: string, updates) => {
        set((state) => ({
          logs: state.logs.map(l =>
            l.date === date ? { ...l, ...updates, date } : l
          )
        }))
      },
    }),
    {
      name: 'recovery-store',
    }
  )
)
