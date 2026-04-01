'use client'

import React from 'react'
import { getAllMuscleGroups, getMuscleGroupLabel } from '../../../data/exerciseUtils'
import type { OnboardingAnswers } from '../../../store/onboardingStore'
import { PillToggle } from '../SelectionCard'
import { StepHeader, NavButtons } from './QuestionnaireShared'

interface Step6PreferencesProps {
  answers: OnboardingAnswers
  update: (partial: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const toggleInArray = <T extends string>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

export function Step6Preferences({ answers, update, onNext, onBack }: Step6PreferencesProps) {
  const muscleGroups = getAllMuscleGroups()

  return (
    <div className="animate-fade-in space-y-5">
      <StepHeader title="Your Preferences" subtitle="Help us tailor the perfect plan." />
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-3">How do you prefer to train?</label>
        <div className="flex flex-wrap gap-2">
          <PillToggle label="Variety each week" selected={answers.varietyPreference === 'variety'} onClick={() => update({ varietyPreference: 'variety' })} />
          <PillToggle label="Same routine" selected={answers.varietyPreference === 'routine'} onClick={() => update({ varietyPreference: 'routine' })} />
          <PillToggle label="Balanced mix" selected={answers.varietyPreference === 'balanced'} onClick={() => update({ varietyPreference: 'balanced' })} />
        </div>
        <p className="text-xs text-text-muted mt-2">Variety keeps things fresh. Routine builds mastery. Balanced combines both.</p>
      </div>
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Focus on these muscle groups (optional)</label>
        <p className="text-xs text-text-muted mb-3">We&apos;ll prioritize these, but balance everything else.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {muscleGroups.map(mg => (
            <PillToggle key={mg} label={getMuscleGroupLabel(mg)} selected={answers.focusAreas.includes(mg)} onClick={() => update({ focusAreas: toggleInArray(answers.focusAreas, mg) })} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Hit each muscle group how often?</label>
        <div className="flex flex-wrap gap-2">
          <PillToggle label="Once per week" selected={answers.muscleFrequency === 'once'} onClick={() => update({ muscleFrequency: 'once' })} />
          <PillToggle label="Twice per week" selected={answers.muscleFrequency === 'twice'} onClick={() => update({ muscleFrequency: 'twice' })} />
          <PillToggle label="Auto-balanced" selected={answers.muscleFrequency === 'auto'} onClick={() => update({ muscleFrequency: 'auto' })} />
        </div>
        <p className="text-xs text-text-muted mt-2">Auto adjusts based on your schedule and goals.</p>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!answers.varietyPreference || !answers.muscleFrequency} />
    </div>
  )
}
