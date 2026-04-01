import type { Difficulty } from '../data/exercises'

export const difficultyColors: Record<Difficulty, 'success' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
}

export const difficultyFilterStyles: Record<Difficulty, string> = {
  beginner: 'bg-success/15 text-success border-success/30',
  intermediate: 'bg-warning/15 text-warning border-warning/30',
  advanced: 'bg-danger/15 text-danger border-danger/30',
}
