'use client'

import React from 'react'
import type { OnboardingAnswers } from '../../../store/onboardingStore'
import { PillToggle } from '../SelectionCard'
import { StepHeader, NavButtons, FAMILIAR_EXERCISES } from './QuestionnaireShared'

interface Step8ExperienceProps {
  answers: OnboardingAnswers
  update: (partial: Partial<OnboardingAnswers>) => void
  onNext: () => void
  onBack: () => void
}

const toggleInArray = <T extends string>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]

export function Step8Experience({ answers, update, onNext, onBack }: Step8ExperienceProps) {
  return (
    <div className="animate-fade-in space-y-5">
      <StepHeader title="Your Experience" subtitle="Which exercises have you done before?" />
      <div>
        <label className="text-sm font-medium text-text-secondary block mb-2">Familiar exercises</label>
        <p className="text-xs text-text-muted mb-3">Check the ones you&apos;ve done. This helps us pick the right progression.</p>
        <div className="flex flex-wrap gap-2">
          {FAMILIAR_EXERCISES.map(ex => (
            <PillToggle key={ex} label={ex} selected={answers.familiarExercises.includes(ex)} onClick={() => update({ familiarExercises: toggleInArray(answers.familiarExercises, ex) })} />
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3">Haven&apos;t done any of these? No problem — we&apos;ll start with the basics.</p>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  )
}
