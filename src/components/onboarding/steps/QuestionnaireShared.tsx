'use client'

import React from 'react'
import { Button } from '../../ui/Button'
import { FiArrowLeft, FiArrowRight, FiTarget, FiAward, FiTrendingDown, FiHeart, FiActivity, FiMaximize2 } from 'react-icons/fi'
import type { OnboardingAnswers } from '../../../store/onboardingStore'

export const INJURY_AREAS = [
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'back-spine', label: 'Back / Spine' },
  { id: 'knees', label: 'Knees' },
  { id: 'wrists', label: 'Wrists' },
  { id: 'hips', label: 'Hips' },
  { id: 'ankles', label: 'Ankles' },
  { id: 'neck', label: 'Neck' },
]

/**
 * Primary goals — the lifting plan generator can deliver these. Flexibility is
 * NOT in this list because the exercise database has no stretching/mobility
 * exercises; selecting it as primary would silently fall back to a normal
 * lifting plan with a "stretch after each session" note. Available as secondary
 * via SECONDARY_GOALS so users can still flag it.
 */
export const GOALS: Array<{ id: OnboardingAnswers['primaryGoal']; label: string; desc: string; icon: React.ReactNode }> = [
  { id: 'strength', label: 'Build Strength', desc: 'Get stronger, lift heavier', icon: <FiTarget /> },
  { id: 'muscle-building', label: 'Build Muscle', desc: 'Grow bigger muscles', icon: <FiAward /> },
  { id: 'toning', label: 'Body Toning', desc: 'Define muscles, look lean', icon: <FiAward /> },
  { id: 'fat-loss', label: 'Lose Fat', desc: 'Burn calories, get leaner', icon: <FiTrendingDown /> },
  { id: 'general-fitness', label: 'General Fitness', desc: 'Stay healthy, feel good', icon: <FiHeart /> },
  { id: 'endurance', label: 'Build Endurance', desc: 'Improve stamina', icon: <FiActivity /> },
]

/** Secondary goals — same list plus flexibility (which only adds a stretching note) */
export const SECONDARY_GOALS: Array<{ id: OnboardingAnswers['primaryGoal'] | 'flexibility'; label: string; desc: string; icon: React.ReactNode }> = [
  ...GOALS,
  { id: 'flexibility', label: 'Improve Flexibility', desc: 'Adds a stretching note to your plan', icon: <FiMaximize2 /> },
]

export const CARDIO_OPTIONS: Array<{ v: OnboardingAnswers['cardioPreference']; l: string }> = [
  { v: 'none', l: 'No cardio' }, { v: 'light', l: 'Light (walks)' },
  { v: 'moderate', l: 'Moderate (20 min)' }, { v: 'heavy', l: 'Heavy (30+ min)' },
]

export const SPLIT_LABELS: Record<number, string> = { 2: 'Full Body', 3: 'PPL', 4: 'Upper/Lower', 5: '5-Day', 6: 'PPL ×2' }

export const WEEKDAYS = [
  { id: 'monday', label: 'M' }, { id: 'tuesday', label: 'T' }, { id: 'wednesday', label: 'W' },
  { id: 'thursday', label: 'T' }, { id: 'friday', label: 'F' }, { id: 'saturday', label: 'S' }, { id: 'sunday', label: 'S' },
]

export const FAMILIAR_EXERCISES = [
  'Push-ups', 'Squats', 'Plank', 'Lunges', 'Bench Press',
  'Deadlift', 'Pull-ups', 'Shoulder Press', 'Rows', 'Curls',
]

export function capitalize(text: string): string {
  return text
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function toValidBodyType(bt: string): 'lean' | 'athletic' | 'stocky' | 'overweight' | 'obese' | undefined {
  if (bt === 'lean' || bt === 'athletic' || bt === 'stocky' || bt === 'overweight' || bt === 'obese') {
    return bt
  }
  return undefined
}

export function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-text-primary">{title}</h2>
      <p className="text-text-secondary text-sm mt-1">{subtitle}</p>
    </div>
  )
}

export function NavButtons({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <div className="flex justify-between pt-2">
      <Button variant="secondary" onClick={onBack}><FiArrowLeft /> Back</Button>
      <Button onClick={onNext} disabled={nextDisabled}><FiArrowRight /> Next</Button>
    </div>
  )
}

export function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-4">
      <span className="text-text-muted flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 text-right min-w-0">
        <span className="text-text-primary capitalize truncate">{value}</span>
        <button onClick={onEdit} className="text-xs text-primary hover:text-primary-light flex-shrink-0" aria-label={`Edit ${label}`}>edit</button>
      </div>
    </div>
  )
}
